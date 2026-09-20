import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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
  private readonly session = inject(AuthSession);
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
      else this.error.set('Unable to verify your session. Please sign in again.');
    } catch (error: unknown) {
      if (this.destroyRef.destroyed) return;
      this.error.set(error instanceof HttpErrorResponse && error.status === 401
        ? 'Invalid username or password.' : 'Unable to sign in. Check your connection and try again.');
    } finally {
      this.form.controls.password.reset();
      this.busy.set(false);
    }
  }
}
