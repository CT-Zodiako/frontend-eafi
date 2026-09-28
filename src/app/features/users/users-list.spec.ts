import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UsersApi } from './users-api';
import { UsersList } from './users-list';

describe('UsersList', () => {
  const list = vi.fn();
  const open = vi.fn();
  beforeEach(() => {
    list.mockReset();
    open.mockReset();
    TestBed.configureTestingModule({ imports: [UsersList], providers: [
      { provide: UsersApi, useValue: { list } },
      { provide: MatDialog, useValue: { open } },
    ] });
  });

  it('loads and renders users on creation', async () => {
    list.mockReturnValue(of([{ id: '1', username: 'admin', role: 'ADMINISTRATOR', createdAt: '2026-01-01T00:00:00Z', updatedAt: '' }]));
    const fixture = TestBed.createComponent(UsersList);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('admin');
    expect(fixture.nativeElement.textContent).toContain('ADMINISTRATOR');
  });

  it('shows an error message when the list fails to load', async () => {
    list.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = TestBed.createComponent(UsersList);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('no está disponible');
  });

  it('reloads the list after a dialog closes with a truthy result', async () => {
    list.mockReturnValue(of([]));
    const afterClosed = new Subject<boolean | undefined>();
    open.mockReturnValue({ afterClosed: () => afterClosed.asObservable() });
    const fixture = TestBed.createComponent(UsersList);
    await fixture.whenStable();
    fixture.componentInstance.openCreateDialog();
    expect(open).toHaveBeenCalled();
    list.mockClear();
    afterClosed.next(true);
    expect(list).toHaveBeenCalled();
  });
});
