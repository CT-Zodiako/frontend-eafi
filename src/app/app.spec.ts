import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { AuthSession } from './core/auth/auth-session';

describe('App', () => {
  beforeEach(() => {
    sessionStorage.removeItem('access_token');
    TestBed.configureTestingModule({ imports: [App], providers: [provideHttpClient(), provideRouter([])] });
  });

  it('renders the shell and anonymous navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('header')?.textContent).toContain('EAFI workspace');
    expect(element.querySelector('nav')?.textContent).toContain('Sign in');
    expect(element.querySelector('main router-outlet')).toBeTruthy();
  });

  it('performs local logout and navigates to login', () => {
    const clear = vi.spyOn(TestBed.inject(AuthSession), 'clear');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    TestBed.createComponent(App).componentInstance.logout();
    expect(clear).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
