import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi, CurrentUser, LoginRequest } from './auth-api';
import { apiErrorMessage } from './api-error';

@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly api = inject(AuthApi);
  private readonly token = signal<string | null>(this.readToken());
  private readonly currentUser = signal<CurrentUser | null>(null);
  private generation = 0;
  private pending: Promise<boolean> | null = null;
  private readonly sessionError = signal('');
  readonly error = this.sessionError.asReadonly();
  readonly user = this.currentUser.asReadonly();

  reportError(error: unknown): void {
    this.sessionError.set(apiErrorMessage(error, 'session'));
  }
  readonly authenticated = computed(() => this.user() !== null);


  authorizationHeader(): string | null {
    const token = this.token();
    return token ? `Bearer ${token}` : null;
  }

  async login(credentials: LoginRequest): Promise<boolean> {
    this.clear();
    const generation = this.generation;
    const response = await firstValueFrom(this.api.login(credentials));
    if (generation !== this.generation) return false;

    sessionStorage.setItem('access_token', response.access_token);
    this.token.set(response.access_token);
    return this.hydrate();
  }

  hydrate(): Promise<boolean> {
    if (this.authenticated()) return Promise.resolve(true);
    if (!this.token()) return Promise.resolve(false);
    if (this.pending) return this.pending;
    const generation = this.generation;
    this.pending = firstValueFrom(this.api.me()).then(user => {
      if (generation !== this.generation) return false;
      this.currentUser.set(user);
      return true;
    }).catch((error: unknown) => {
      if (generation === this.generation) {
        this.clear();
        this.reportError(error);
      }
      return false;
    }).finally(() => {
      if (generation === this.generation) this.pending = null;
    });
    return this.pending;
  }

  clear(): void {
    this.sessionError.set('');
    this.generation++;
    this.pending = null;
    this.token.set(null);
    this.currentUser.set(null);
    try { sessionStorage.removeItem('access_token'); } catch { /* Storage may be unavailable. */ }
  }

  private readToken(): string | null {
    try { return sessionStorage.getItem('access_token'); } catch { return null; }
  }
}
