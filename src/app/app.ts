import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar, SidebarItem } from './layout/sidebar';
import { AuthSession } from './core/auth/auth-session';

const navigationItems: readonly SidebarItem[] = [
  { label: 'Usuarios', path: '/users', roles: ['ADMINISTRATOR'] },
  { label: 'Mis proyectos', path: '/evaluator/projects', roles: ['EVALUATOR'] },
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly session = inject(AuthSession);
  readonly navigationItems = navigationItems;
  readonly sidebarOpen = signal(false);
}
