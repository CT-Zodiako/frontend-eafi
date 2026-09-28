import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { apiErrorMessage } from '../../core/auth/api-error';
import { CurrentUser } from '../../core/auth/auth-api';
import { UsersApi } from './users-api';
import { CreateUserDialog } from './create-user-dialog';

@Component({
  selector: 'app-users-list',
  imports: [MatButtonModule, DatePipe],
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersList {
  private readonly usersApi = inject(UsersApi); // inyecta el servicio del front users-api.ts
  private readonly dialog = inject(MatDialog); // servicio de Angular Material para abrir modales
  private readonly destroyRef = inject(DestroyRef); // detecta si el componente ya se destruyó
  readonly users = signal<readonly CurrentUser[]>([]); // lista que pinta la tabla
  readonly loading = signal(true); // true mientras espera la respuesta del backend
  readonly error = signal(''); // mensaje de error para mostrar en el template

  constructor() {
    void this.load(); // !carga la lista apenas se crea el componente
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const users = await firstValueFrom(this.usersApi.list()); // ! pide GET /users y espera la respuesta
      if (this.destroyRef.destroyed) return; // evita actualizar signals si el componente ya no existe
      this.users.set(users);
    } catch (error: unknown) {
      if (this.destroyRef.destroyed) return;
      this.error.set(apiErrorMessage(error, 'users')); // traduce el error a un mensaje en español
    } finally {
      this.loading.set(false);
    }
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CreateUserDialog); // abre el modal de creación
    ref.afterClosed().subscribe(created => {
      if (created) void this.load(); // si se creó un usuario, recarga la lista
    });
  }
}
