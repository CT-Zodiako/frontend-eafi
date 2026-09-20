import { Component, inject } from '@angular/core';
import { AuthSession } from '../../core/auth/auth-session';

@Component({
  selector: 'app-home',
  template: `
    @if (session.user(); as user) {
      <section aria-labelledby="home-title">
        <h1 id="home-title">Welcome to EAFI</h1>
        <p>Signed in as {{ user.username }}.</p>
        <p>Your workspace is ready. More features will appear here.</p>
      </section>
    }
  `,
})
export class Home { readonly session = inject(AuthSession); }
