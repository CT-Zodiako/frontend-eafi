import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { apiErrorMessage } from '../../core/auth/api-error';
import { CurrentUser } from '../../core/auth/auth-api';
import { UsersApi } from './users-api';

@Component({
  selector: 'app-create-user-dialog',
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './create-user-dialog.html',
  styleUrl: './create-user-dialog.scss',
})
export class CreateUserDialog {
  private readonly usersApi = inject(UsersApi); // inyecta el servicio del front users-api.ts
  private readonly dialogRef = inject(MatDialogRef<CreateUserDialog>); // referencia a este mismo modal, para cerrarlo
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false); // true mientras se envía el formulario
  readonly error = signal('');
  readonly form = new FormGroup({ // formulario reactivo con sus validaciones
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.pattern(/\S/)] }),
    role: new FormControl<CurrentUser['role']>('EVALUATOR', { nonNullable: true, validators: [Validators.required] }),
  });

  async submit(): Promise<void> {
    if (this.busy()) return; // evita doble envío
    this.form.markAllAsTouched(); // muestra los errores de validación si los hay
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.usersApi.create(this.form.getRawValue())); // llama a POST /users
      if (this.destroyRef.destroyed) return;
      this.dialogRef.close(true); // cierra el modal y avisa a UsersList que hubo alta
    } catch (error: unknown) {
      if (this.destroyRef.destroyed) return;
      this.error.set(apiErrorMessage(error, 'users')); // ej: "Ese nombre de usuario ya está en uso"
    } finally {
      this.busy.set(false);
    }
  }
}
