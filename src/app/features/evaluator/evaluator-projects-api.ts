import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { API_BASE_URL } from '../../core/auth/api-config';

export interface EvaluatorProject {
  id: string;
  name: string;
  description: string;
  categoryEditionId: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class EvaluatorProjectsApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list() {
    return this.http.get<EvaluatorProject[]>(`${this.base}/evaluator/projects`).pipe(timeout(10_000));
  }
}
