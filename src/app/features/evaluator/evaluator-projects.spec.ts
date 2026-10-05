import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { EvaluatorProjectsApi } from './evaluator-projects-api';
import { EvaluatorProjects } from './evaluator-projects';

describe('EvaluatorProjects', () => {
  const list = vi.fn();
  beforeEach(() => {
    list.mockReset();
    TestBed.configureTestingModule({
      imports: [EvaluatorProjects],
      providers: [{ provide: EvaluatorProjectsApi, useValue: { list } }],
    });
  });

  it('loads and renders assigned projects on creation', async () => {
    list.mockReturnValue(of([
      { id: '1', name: 'Proyecto A', description: 'Descripción A', categoryEditionId: 'c1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '' },
    ]));
    const fixture = TestBed.createComponent(EvaluatorProjects);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Proyecto A');
    expect(fixture.nativeElement.textContent).toContain('Descripción A');
  });

  it('shows an empty state message when there is no assignment', async () => {
    list.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(EvaluatorProjects);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No tenés proyectos asignados todavía.');
  });

  it('shows an accessible error message when the list fails to load', async () => {
    list.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = TestBed.createComponent(EvaluatorProjects);
    await fixture.whenStable();
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('no está disponible');
    expect(fixture.nativeElement.textContent).not.toContain('No tenés proyectos asignados todavía.');
  });

  it('retries loading when the retry button is clicked after a failure', async () => {
    list.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })));
    list.mockReturnValueOnce(of([
      { id: '1', name: 'Proyecto A', description: 'Descripción A', categoryEditionId: 'c1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '' },
    ]));
    const fixture = TestBed.createComponent(EvaluatorProjects);
    await fixture.whenStable();
    fixture.detectChanges();
    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector('[role="alert"] button');
    retryButton.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Proyecto A');
  });
});
