import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from './api-config';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';

export interface LoginRequest { username: string; password: string; }
export interface LoginResponse { access_token: string; token_type: 'Bearer'; expires_in: number; }
export interface CurrentUser {
  id: string;
  username: string;
  role: 'ADMINISTRATOR' | 'EVALUATOR';
  createdAt: string;
  updatedAt: string;
}
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  login(credentials: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, credentials).pipe(timeout(10_000));
  }
  me() { return this.http.get<CurrentUser>(`${this.base}/auth/me`).pipe(timeout(10_000)); }
}
