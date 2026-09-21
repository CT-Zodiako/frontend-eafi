import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot } from '@angular/router';
import { AuthSession } from './auth-session';
import { roleGuard } from './role-guard';

describe('roleGuard', () => {
  const session = { hydrate: vi.fn(), user: vi.fn() };
  beforeEach(() => {
    session.hydrate.mockResolvedValue(true);
    session.user.mockReturnValue({ role: 'EVALUATOR' });
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthSession, useValue: session }] });
  });
  const run = (roles?: string[]) => TestBed.runInInjectionContext(() => roleGuard(
    { data: roles === undefined ? {} : { roles } } as ActivatedRouteSnapshot, {} as RouterStateSnapshot,
  ));
  it('redirects anonymous users to login', async () => {
    session.hydrate.mockResolvedValue(false);
    expect(String(await run(['ADMINISTRATOR']))).toBe('/login');
  });
  it('denies evaluators and absent or empty metadata', async () => {
    for (const roles of [['ADMINISTRATOR'], [], undefined]) {
      expect(String(await run(roles))).toBe('/home');
    }
  });
  it('allows a hydrated administrator', async () => {
    session.user.mockReturnValue({ role: 'ADMINISTRATOR' });
    expect(await run(['ADMINISTRATOR'])).toBe(true);
  });
});
