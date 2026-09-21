import { Component, DestroyRef, inject, signal } from '@angular/core';
import { apiErrorMessage } from '../../core/auth/api-error';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthSession } from '../../core/auth/auth-session';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  readonly session = inject(AuthSession);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.pattern(/\S/)] }),
  });

  async submit(): Promise<void> {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const authenticated = await this.session.login(this.form.getRawValue());
      if (this.destroyRef.destroyed) return;
      if (authenticated) await this.router.navigateByUrl('/home');
      else this.error.set(this.session.error() || apiErrorMessage(null, 'session'));
    } catch (error: unknown) {
      if (this.destroyRef.destroyed) return;
      this.error.set(apiErrorMessage(error, 'login'));
    } finally {
      this.form.controls.password.reset();
      this.busy.set(false);
    }
  }
}
