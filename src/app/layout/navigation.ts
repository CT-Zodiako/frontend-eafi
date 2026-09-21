import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthSession } from '../core/auth/auth-session';
import { CurrentUser } from '../core/auth/auth-api';

export interface NavigationItem {
  label: string;
  path: string;
  roles: readonly CurrentUser['role'][];
}

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, MatButtonModule, MatMenuModule],
  template: `
    <nav aria-label="Main navigation">
      @if (session.user(); as user) {
        <span class="identity">{{ user.username }} · {{ user.role }}</span>
        <button mat-flat-button [matMenuTriggerFor]="menu" type="button">Menu</button>
        <mat-menu #menu="matMenu">
          <a mat-menu-item routerLink="/home">Home</a>
          @for (item of visibleItems(); track item.path) {
            <a mat-menu-item [routerLink]="item.path">{{ item.label }}</a>
          }
          <button mat-menu-item type="button" (click)="logout()">Sign out</button>
        </mat-menu>
      } @else {
        <a mat-button routerLink="/login">Sign in</a>
      }
    </nav>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    nav { display: flex; align-items: center; flex-wrap: wrap; gap: var(--eafi-space-4); }
    .identity { overflow-wrap: anywhere; min-width: 0; flex: 1 1 auto; }
  `,
})
export class Navigation {
  readonly session = inject(AuthSession);
  private readonly router = inject(Router);
  // Add entries only when their real routes exist and are guarded separately.
  readonly items = input<readonly NavigationItem[]>([]);
  readonly visibleItems = computed(() => {
    const role = this.session.user()?.role;
    return role ? this.items().filter(item => item.roles.includes(role)) : [];
  });

  logout(): void {
    this.session.clear();
    void this.router.navigateByUrl('/login');
  }
}
