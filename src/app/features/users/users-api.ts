import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { API_BASE_URL } from '../../core/auth/api-config';
import { CurrentUser } from '../../core/auth/auth-api';

export interface CreateUserRequest {
  username: string;
  password: string;
  role: CurrentUser['role'];
}

@Injectable({ providedIn: 'root' }) // servicio único para toda la app (singleton)
export class UsersApi {
  private readonly http = inject(HttpClient); // cliente HTTP de Angular
  private readonly base = inject(API_BASE_URL); // URL base de la API (ej: http://localhost:3001/api/v1)
  create(user: CreateUserRequest) {
    // POST /users — el interceptor le agrega el token antes de salir
    return this.http.post<CurrentUser>(`${this.base}/users`, user).pipe(timeout(10_000));
  }
  list() {
    //! GET /users — trae todos los usuarios 
    return this.http.get<CurrentUser[]>(`${this.base}/users`).pipe(timeout(10_000));
  }
}
