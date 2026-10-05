import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { apiErrorMessage } from './api-error';

describe('apiErrorMessage', () => {
  it('distinguishes login rejection from expired sessions', () => {
    const error = new HttpErrorResponse({ status: 401 });
    expect(apiErrorMessage(error, 'login')).toBe('Usuario o contraseña incorrectos.');
    expect(apiErrorMessage(error, 'session')).toContain('venció');
  });
  it.each([0, 400, 403, 429, 500, 503])('maps status %s without exposing server content', status => {
    const message = apiErrorMessage(new HttpErrorResponse({ status, error: 'private-server-detail' }), 'session');
    expect(message.length).toBeGreaterThan(0);
    expect(message).not.toContain('private-server-detail');
  });
  it('maps timeout and unknown failures safely', () => {
    expect(apiErrorMessage(new TimeoutError(), 'login')).toContain('tardó demasiado');
    expect(apiErrorMessage(new Error('private'), 'session')).not.toContain('private');
  });

  it('maps evaluator-projects errors for generic, network, 401, 403 and timeout cases', () => {
    expect(apiErrorMessage(new Error('private'), 'evaluator-projects')).toContain('No se pudieron cargar tus proyectos asignados');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }), 'evaluator-projects')).toContain('No se pudo conectar');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 401 }), 'evaluator-projects')).toContain('sesión venció');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 403 }), 'evaluator-projects')).toBe('No tenés permiso para ver estos proyectos.');
    expect(apiErrorMessage(new TimeoutError(), 'evaluator-projects')).toContain('tardó demasiado');
  });
});
