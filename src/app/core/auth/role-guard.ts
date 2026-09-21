import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSession } from './auth-session';

// UI navigation only; the backend remains the authorization boundary.
export const roleGuard: CanActivateFn = async (route) => {
  const session = inject(AuthSession);
  const router = inject(Router);
  if (!await session.hydrate()) return router.createUrlTree(['/login']);
  const roles: unknown = route.data['roles'];
  return (Array.isArray(roles) && roles.includes(session.user()?.role)) ||
    router.createUrlTree(['/home']);
};
