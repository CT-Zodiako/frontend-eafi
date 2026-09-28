import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { UsersApi } from './users-api';
import { CreateUserDialog } from './create-user-dialog';

describe('CreateUserDialog', () => {
  const create = vi.fn();
  const close = vi.fn();
  beforeEach(() => {
    create.mockReset();
    close.mockReset();
    TestBed.configureTestingModule({ imports: [CreateUserDialog], providers: [
      { provide: UsersApi, useValue: { create } },
      { provide: MatDialogRef, useValue: { close } },
    ] });
  });

  it('rejects blank usernames and short passwords', async () => {
    const fixture = TestBed.createComponent(CreateUserDialog);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ username: '   ', password: 'short', role: 'EVALUATOR' });
    await fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(create).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Ingresá un nombre de usuario');
  });

  it('shows a duplicate-username message and keeps the form usable', async () => {
    create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const fixture = TestBed.createComponent(CreateUserDialog);
    fixture.componentInstance.form.setValue({ username: 'taken', password: 'password1', role: 'EVALUATOR' });
    await fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('ya está en uso');
    expect(fixture.componentInstance.busy()).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it('creates the user and closes the dialog with a truthy result', async () => {
    create.mockReturnValue(of({ id: '1', username: 'new-user', role: 'EVALUATOR', createdAt: '', updatedAt: '' }));
    const fixture = TestBed.createComponent(CreateUserDialog);
    fixture.componentInstance.form.setValue({ username: 'new-user', password: 'password1', role: 'EVALUATOR' });
    await fixture.componentInstance.submit();
    expect(close).toHaveBeenCalledWith(true);
  });
});
