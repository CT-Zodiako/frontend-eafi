import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthSession } from '../../core/auth/auth-session';
import { Login } from './login';

describe('Login', () => {
  const login = vi.fn();
  beforeEach(() => {
    login.mockReset();
    TestBed.configureTestingModule({ imports: [Login], providers: [
      provideRouter([]), { provide: AuthSession, useValue: { login, error: signal('') } },
    ] });
  });

  it('labels credentials and rejects blank usernames and short passwords', async () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ username: '   ', password: 'short' });
    await fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Ingresá un nombre de usuario');
    expect(fixture.nativeElement.querySelector('input[type="password"]').autocomplete).toBe('current-password');
    expect(fixture.nativeElement.querySelectorAll('mat-label').length).toBe(2);
  });

  it('shows a safe credentials error and clears the password', async () => {
    login.mockRejectedValue(new HttpErrorResponse({ status: 401 }));
    const fixture = TestBed.createComponent(Login);
    fixture.componentInstance.form.setValue({ username: 'test-user', password: 'test-password' });
    await fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Usuario o contraseña incorrectos');
    expect(fixture.componentInstance.form.controls.password.value).toBe('');
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it('suppresses duplicate submissions and navigates on success', async () => {
    let resolve!: (value: boolean) => void;
    login.mockReturnValue(new Promise<boolean>(done => { resolve = done; }));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const component = TestBed.createComponent(Login).componentInstance;
    component.form.setValue({ username: 'test-user', password: 'test-password' });
    const result = component.submit();
    await component.submit();
    expect(login).toHaveBeenCalledTimes(1);
    resolve(true);
    await result;
    expect(navigate).toHaveBeenCalledWith('/home');
  });
});
