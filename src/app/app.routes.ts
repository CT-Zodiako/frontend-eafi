import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  { path: 'login', title: 'Iniciar sesión · EAFI', loadComponent: () => import('./features/auth/login').then(m => m.Login) },
  { path: 'home', title: 'Inicio · EAFI', canActivate: [authGuard], loadComponent: () => import('./features/home/home').then(m => m.Home) },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];
