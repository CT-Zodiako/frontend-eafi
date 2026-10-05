import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { apiErrorMessage } from '../../core/auth/api-error';
import { EvaluatorProject, EvaluatorProjectsApi } from './evaluator-projects-api';

@Component({
  selector: 'app-evaluator-projects',
  imports: [DatePipe, MatButtonModule],
  templateUrl: './evaluator-projects.html',
  styleUrl: './evaluator-projects.scss',
})
export class EvaluatorProjects {
  private readonly projectsApi = inject(EvaluatorProjectsApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly projects = signal<readonly EvaluatorProject[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const projects = await firstValueFrom(this.projectsApi.list());
      if (this.destroyRef.destroyed) return;
      this.projects.set(projects);
    } catch (error: unknown) {
      if (this.destroyRef.destroyed) return;
      this.projects.set([]);
      this.error.set(apiErrorMessage(error, 'evaluator-projects'));
    } finally {
      if (!this.destroyRef.destroyed) this.loading.set(false);
    }
  }
}
