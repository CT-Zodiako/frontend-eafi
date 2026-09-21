import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

export function apiErrorMessage(error: unknown, context: 'login' | 'session'): string {
  if (error instanceof TimeoutError) return 'The request timed out. Please try again.';
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Unable to reach the server. Check your connection and try again.';
    if (error.status === 401) return context === 'login'
      ? 'Invalid username or password.' : 'Your session has expired. Please sign in again.';
    if (error.status === 403) return 'You do not have permission to perform this action.';
    if (error.status === 429) return 'Too many attempts. Please wait and try again.';
    if (error.status >= 500) return 'The service is temporarily unavailable. Please try again later.';
    if (error.status === 400) return 'Check the information entered and try again.';
  }
  return context === 'login'
    ? 'Unable to sign in. Check your connection and try again.'
    : 'Unable to verify your session. Please sign in again.';
}
