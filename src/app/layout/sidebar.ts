import { Component, computed, inject, input, output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthSession } from '../core/auth/auth-session';
import { CurrentUser } from '../core/auth/auth-api';

export interface SidebarItem {
  label: string;
  path: string;
  roles: readonly CurrentUser['role'][];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatButtonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly session = inject(AuthSession);
  private readonly router = inject(Router);
  // Add entries only when their real routes exist and are guarded separately.
  readonly items = input<readonly SidebarItem[]>([]);
  readonly open = input(false);
  readonly navigated = output<void>();
  readonly visibleItems = computed(() => {
    const role = this.session.user()?.role;
    return role ? this.items().filter(item => item.roles.includes(role)) : [];
  });

  logout(): void {
    this.session.clear();
    this.navigated.emit();
    void this.router.navigateByUrl('/login');
  }
}
