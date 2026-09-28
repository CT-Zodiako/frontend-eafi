import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthSession } from '../core/auth/auth-session';
import { CurrentUser } from '../core/auth/auth-api';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  it('filters supplied entries by the current role without inventing routes', () => {
    const user = signal<Pick<CurrentUser, 'username' | 'role'> | null>({ username: 'reader', role: 'EVALUATOR' });
    TestBed.configureTestingModule({ providers: [provideRouter([]), {
      provide: AuthSession, useValue: { user, clear: vi.fn() },
    }] });
    const fixture = TestBed.createComponent(Sidebar);
    expect(fixture.componentInstance.visibleItems()).toEqual([]);
    const item = { label: 'Restricted test entry', path: '/test-only', roles: ['ADMINISTRATOR'] };
    fixture.componentRef.setInput('items', [item]);
    expect(fixture.componentInstance.visibleItems()).toEqual([]);
    user.set({ username: 'admin', role: 'ADMINISTRATOR' });
    expect(fixture.componentInstance.visibleItems()).toEqual([item]);
    user.set(null);
    expect(fixture.componentInstance.visibleItems()).toEqual([]);
  });

  it('clears the session and navigates to login on logout', () => {
    const clear = vi.fn();
    const user = signal<Pick<CurrentUser, 'username' | 'role'> | null>({ username: 'admin', role: 'ADMINISTRATOR' });
    TestBed.configureTestingModule({ providers: [provideRouter([]), {
      provide: AuthSession, useValue: { user, clear },
    }] });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Sidebar);
    fixture.componentInstance.logout();
    expect(clear).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
