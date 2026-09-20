import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthSession } from './core/auth/auth-session';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly session = inject(AuthSession);
  private readonly router = inject(Router);

  logout(): void {
    this.session.clear();
    void this.router.navigateByUrl('/login');
  }
}
