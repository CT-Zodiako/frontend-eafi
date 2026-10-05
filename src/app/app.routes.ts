import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { roleGuard } from './core/auth/role-guard';

export const routes: Routes = [
  { path: 'login', title: 'Iniciar sesión · EAFI', loadComponent: () => import('./features/auth/login').then(m => m.Login) },
  { path: 'home', title: 'Inicio · EAFI', canActivate: [authGuard], loadComponent: () => import('./features/home/home').then(m => m.Home) },
  {
    path: 'users', title: 'Usuarios · EAFI', canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR'] }, // ! RUTA
    loadComponent: () => import('./features/users/users-list').then(m => m.UsersList),
  },
  {
    path: 'evaluator/projects', title: 'Mis proyectos · EAFI', canActivate: [roleGuard], data: { roles: ['EVALUATOR'] },
    loadComponent: () => import('./features/evaluator/evaluator-projects').then(m => m.EvaluatorProjects),
  },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];
