import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

export function apiErrorMessage(error: unknown, context: 'login' | 'session'): string {
  if (error instanceof TimeoutError) return 'La solicitud tardó demasiado. Intentá de nuevo.';
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
    if (error.status === 401) return context === 'login'
      ? 'Usuario o contraseña incorrectos.' : 'Tu sesión venció. Volvé a iniciar sesión.';
    if (error.status === 403) return 'No tenés permiso para realizar esta acción.';
    if (error.status === 429) return 'Demasiados intentos. Esperá e intentá de nuevo.';
    if (error.status >= 500) return 'El servicio no está disponible temporalmente. Intentá de nuevo más tarde.';
    if (error.status === 400) return 'Revisá la información ingresada e intentá de nuevo.';
  }
  return context === 'login'
    ? 'No se pudo iniciar sesión. Revisá tu conexión e intentá de nuevo.'
    : 'No se pudo verificar tu sesión. Volvé a iniciar sesión.';
}
