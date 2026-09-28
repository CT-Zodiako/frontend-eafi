import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { Sidebar } from './layout/sidebar';
import { AuthSession } from './core/auth/auth-session';

describe('App', () => {
  beforeEach(() => {
    sessionStorage.removeItem('access_token');
    TestBed.configureTestingModule({ imports: [App], providers: [provideHttpClient(), provideRouter([])] });
  });

  it('renders the shell without a sidebar when anonymous', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('header')?.textContent).toContain('Espacio de trabajo EAFI');
    expect(element.querySelector('aside')).toBeNull();
    expect(element.querySelector('main router-outlet')).toBeTruthy();
  });

  it('performs local logout and navigates to login', () => {
    const clear = vi.spyOn(TestBed.inject(AuthSession), 'clear');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    TestBed.createComponent(Sidebar).componentInstance.logout();
    expect(clear).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
