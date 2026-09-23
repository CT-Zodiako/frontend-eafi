import { Component, inject } from '@angular/core';
import { AuthSession } from '../../core/auth/auth-session';

@Component({
  selector: 'app-home',
  template: `
    @if (session.user(); as user) {
      <section aria-labelledby="home-title">
        <h1 id="home-title">Te damos la bienvenida a EAFI</h1>
        <p>Iniciaste sesión como {{ user.username }}.</p>
        <p>Tu espacio de trabajo está listo. Pronto vas a encontrar más funciones acá.</p>
      </section>
    }
  `,
})
export class Home { readonly session = inject(AuthSession); }
