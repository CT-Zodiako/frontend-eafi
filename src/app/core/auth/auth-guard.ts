import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSession } from './auth-session';

export const authGuard: CanActivateFn = async () => {
  const session = inject(AuthSession);
  const router = inject(Router);
  return await session.hydrate() || router.createUrlTree(['/login']);
};
