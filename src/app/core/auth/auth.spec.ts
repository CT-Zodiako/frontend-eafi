import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { API_BASE_URL, AuthApi, CurrentUser } from './auth-api';
import { AuthSession } from './auth-session';
import { authInterceptor } from './auth-interceptor';
import { authGuard } from './auth-guard';

const base = 'http://localhost:3001/api/v1';
const user: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000001', username: 'test-user', role: 'EVALUATOR',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Authentication boundaries', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.removeItem('access_token');
    TestBed.configureTestingModule({ providers: [
      provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(), { provide: API_BASE_URL, useValue: base },
    ] });
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });
  afterEach(() => { http.verify(); sessionStorage.removeItem('access_token'); });

  it('posts credentials, persists the token, and authenticates only after me', async () => {
    const session = TestBed.inject(AuthSession);
    const credentials = { username: 'test-user', password: 'test-password' };
    const result = session.login(credentials);
    const login = http.expectOne(`${base}/auth/login`);
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual(credentials);
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush({ access_token: 'test-token', token_type: 'Bearer', expires_in: 60 });
    await Promise.resolve();
    expect(session.authenticated()).toBe(false);
    const me = http.expectOne(`${base}/auth/me`);
    expect(me.request.method).toBe('GET');
    expect(me.request.headers.get('Authorization')).toBe('Bearer test-token');
    me.flush(user);
    expect(await result).toBe(true);
    expect(session.user()).toEqual(user);
    expect(sessionStorage.getItem('access_token')).toBe('test-token');
    session.clear();
    expect(session.user()).toBeNull();
    expect(sessionStorage.getItem('access_token')).toBeNull();
  });

  it('hydrates a stored session once and ignores a response after logout', async () => {
    sessionStorage.setItem('access_token', 'test-token');
    const session = TestBed.inject(AuthSession);
    const result = session.hydrate();
    expect(session.hydrate()).toBe(result);
    session.clear();
    http.expectOne(`${base}/auth/me`).flush(user);
    expect(await result).toBe(false);
    expect(session.authenticated()).toBe(false);
  });

  it('clears an expired session on 401 and redirects to login', async () => {
    sessionStorage.setItem('access_token', 'expired-test-token');
    const session = TestBed.inject(AuthSession);
    const result = session.hydrate();
    http.expectOne(`${base}/auth/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(await result).toBe(false);
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('does not attach a token or clear the session for non-API requests', () => {
    sessionStorage.setItem('access_token', 'test-token');
    const session = TestBed.inject(AuthSession);
    const client = TestBed.inject(HttpClient);
    for (const url of ['https://external.invalid/api/v1/auth/me', `${base}-other`, '/assets/logo.svg', '/api/v1/auth/me']) {
      client.get(url).subscribe({ error: () => undefined });
      const request = http.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({}, { status: 401, statusText: 'Unauthorized' });
    }
    expect(session.authorizationHeader()).toBe('Bearer test-token');
  });

  it('leaves an established session intact on 403', () => {
    sessionStorage.setItem('access_token', 'test-token');
    const session = TestBed.inject(AuthSession);
    TestBed.inject(AuthApi).me().subscribe({ error: () => undefined });
    http.expectOne(`${base}/auth/me`).flush({}, { status: 403, statusText: 'Forbidden' });
    expect(session.authorizationHeader()).toBe('Bearer test-token');
  });

  it('fails closed when me is unavailable', async () => {
    sessionStorage.setItem('access_token', 'test-token');
    const session = TestBed.inject(AuthSession);
    const result = session.hydrate();
    http.expectOne(`${base}/auth/me`).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(await result).toBe(false);
    expect(session.authenticated()).toBe(false);
    expect(sessionStorage.getItem('access_token')).toBeNull();
  });

  it('does not invalidate a newer login after an old API request returns 401', async () => {
    sessionStorage.setItem('access_token', 'old-test-token');
    const session = TestBed.inject(AuthSession);
    TestBed.inject(AuthApi).me().subscribe({ error: () => undefined });
    const oldRequest = http.expectOne(`${base}/auth/me`);
    const result = session.login({ username: 'test-user', password: 'test-password' });
    http.expectOne(`${base}/auth/login`).flush({ access_token: 'new-test-token', token_type: 'Bearer', expires_in: 60 });
    await Promise.resolve();
    http.expectOne(`${base}/auth/me`).flush(user);
    await result;
    oldRequest.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.authenticated()).toBe(true);
    expect(sessionStorage.getItem('access_token')).toBe('new-test-token');
  });

  it('denies anonymous routes and allows a verified session', async () => {
    const invokeGuard = () => TestBed.runInInjectionContext(() => authGuard(
      {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot,
    ));
    expect(String(await invokeGuard())).toBe('/login');
    const session = TestBed.inject(AuthSession);
    const result = session.login({ username: 'test-user', password: 'test-password' });
    http.expectOne(`${base}/auth/login`).flush({ access_token: 'test-token', token_type: 'Bearer', expires_in: 60 });
    await Promise.resolve();
    http.expectOne(`${base}/auth/me`).flush(user);
    await result;
    expect(await invokeGuard()).toBe(true);
  });
});
