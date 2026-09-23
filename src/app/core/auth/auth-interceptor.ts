import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { AuthSession } from './auth-session';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const base = new URL(inject(API_BASE_URL));
  const url = new URL(request.url, inject(DOCUMENT).baseURI);
  const apiPath = base.pathname.replace(/\/$/, '');
  const isApi = url.origin === base.origin &&
    (url.pathname === apiPath || url.pathname.startsWith(`${apiPath}/`));
  if (!isApi) return next(request);
  const session = inject(AuthSession);
  const router = inject(Router);
  const authorization = session.authorizationHeader();
  const authenticatedRequest = authorization
    ? request.clone({ setHeaders: { Authorization: authorization } }) : request;
  return next(authenticatedRequest).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse && error.status === 401 &&
        authorization === session.authorizationHeader()) {
      session.clear();
      if (authorization) session.reportError(error);
      void router.navigateByUrl('/login');
    }
    return throwError(() => error);
  }));
};
