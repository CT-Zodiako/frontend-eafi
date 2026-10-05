import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../core/auth/api-config';
import { EvaluatorProject, EvaluatorProjectsApi } from './evaluator-projects-api';

const base = 'http://localhost:3001/api/v1';
const project: EvaluatorProject = {
  id: '00000000-0000-4000-8000-000000000001', name: 'Proyecto A', description: 'Descripción A',
  categoryEditionId: '00000000-0000-4000-8000-000000000002',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('EvaluatorProjectsApi', () => {
  let http: HttpTestingController;
  let api: EvaluatorProjectsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: base },
    ] });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(EvaluatorProjectsApi);
  });
  afterEach(() => http.verify());

  it('requests the evaluator projects endpoint under the configured API base URL', () => {
    api.list().subscribe();
    const request = http.expectOne(`${base}/evaluator/projects`);
    expect(request.request.method).toBe('GET');
    request.flush([project]);
  });

  it('propagates an empty array when the evaluator has no assignments', async () => {
    const result = new Promise<readonly EvaluatorProject[]>(resolve => api.list().subscribe(resolve));
    http.expectOne(`${base}/evaluator/projects`).flush([]);
    expect(await result).toEqual([]);
  });
});
