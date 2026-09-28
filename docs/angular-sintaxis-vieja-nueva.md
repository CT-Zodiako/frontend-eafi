# Angular tradicional y Angular 21

## Objetivo

Esta guía compara la sintaxis tradicional de Angular con la sintaxis moderna usada en Angular 21.

La sintaxis anterior no está mal ni desaparece automáticamente. La migración puede hacerse por partes. Para código nuevo del frontend EAFI usamos la sintaxis moderna.

## Comparación rápida

| Necesidad | Sintaxis tradicional | Sintaxis moderna |
|---|---|---|
| Arranque | `bootstrapModule(AppModule)` | `bootstrapApplication(App, appConfig)` |
| Organización | `NgModule` | Standalone components |
| Inyección | Constructor | `inject()` |
| Entrada | `@Input()` | `input()` |
| Evento | `@Output()` + `EventEmitter` | `output()` |
| Estado | Campo mutable | `signal()` |
| Estado derivado | Getter o método | `computed()` |
| Efectos externos | Suscripción/manual | `effect()` cuando corresponde |
| Condicional HTML | `*ngIf` | `@if` |
| Lista HTML | `*ngFor` | `@for` |
| Alternativas HTML | `ngSwitch` | `@switch` |

## 1. `NgModule` y standalone

### Tradicional

```ts
@NgModule({
  declarations: [LoginComponent],
  imports: [CommonModule, ReactiveFormsModule],
})
export class AuthModule {}
```

El módulo agrupaba componentes, imports y providers.

### Angular 21

```ts
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {}
```

El componente declara sus propias dependencias. El proyecto arranca con:

```ts
bootstrapApplication(App, appConfig);
```

Archivo actual:

- [`app.config.ts`](../src/app/app.config.ts)

## 2. `constructor` y `inject()`

### Tradicional

```ts
constructor(private readonly router: Router) {}
```

### Angular 21

```ts
private readonly router = inject(Router);
```

Ambos reciben la misma dependencia. `inject()` solamente cambia la forma de declararla.

En el proyecto actual se usa en `Login`, `AuthSession`, `AuthApi`, guards e interceptor.

## 3. Estado: variables y signals

### Tradicional

```ts
loading = false;
error = '';

start() {
  this.loading = true;
}
```

### Angular 21

```ts
readonly loading = signal(false);
readonly error = signal('');

start() {
  this.loading.set(true);
}
```

Lectura de una signal:

```ts
if (this.loading()) {
  // Está cargando
}
```

En HTML:

```html
<button [disabled]="loading()">
  {{ loading() ? 'Cargando…' : 'Guardar' }}
</button>
```

En el login actual se usan:

```ts
readonly busy = signal(false);
readonly error = signal('');
```

Archivo:

- [`login.ts`](../src/app/features/auth/login.ts)

## 4. Estado derivado: getter y `computed()`

### Tradicional

```ts
get authenticated(): boolean {
  return this.user !== null;
}
```

### Angular 21

```ts
readonly authenticated = computed(
  () => this.user() !== null
);
```

`computed()` sirve cuando un valor depende de una o más signals.

En el proyecto:

```ts
readonly authenticated = computed(() => this.user() !== null);
```

Archivo:

- [`auth-session.ts`](../src/app/core/auth/auth-session.ts)

## 5. `effect()`

`effect()` ejecuta código cuando cambia una signal:

```ts
effect(() => {
  console.log(this.theme());
});
```

Usarlo para sincronizar con algo externo:

- APIs del navegador.
- Librerías externas.
- Logging controlado.

No usarlo para calcular datos:

```ts
// Evitar
this.effect(() => {
  this.total.set(this.price() * this.quantity());
});
```

Usar:

```ts
readonly total = computed(
  () => this.price() * this.quantity()
);
```

## 6. `@Input()` y `input()`

### Tradicional

```ts
@Input() title = '';
```

### Angular 21

```ts
readonly title = input('');
```

Input obligatorio:

```ts
readonly user = input.required<User>();
```

Como es una signal, se lee así:

```ts
this.user();
```

## 7. `@Output()` y `output()`

### Tradicional

```ts
@Output() saved = new EventEmitter<User>();

save(user: User) {
  this.saved.emit(user);
}
```

### Angular 21

```ts
readonly saved = output<User>();

save(user: User) {
  this.saved.emit(user);
}
```

El componente padre puede escuchar el evento igual:

```html
<app-form (saved)="saveUser($event)" />
```

## 8. `*ngIf` y `@if`

### Tradicional

```html
<div *ngIf="user">
  Hola
</div>
```

### Angular 21

```html
@if (user()) {
  <div>Hola</div>
} @else {
  <div>No hay usuario</div>
}
```

El control flow nuevo es más claro y no necesita escribir una directiva estructural.

En el login actual:

```html
@if (error()) {
  <p role="alert">{{ error() }}</p>
}
```

Archivo:

- [`login.html`](../src/app/features/auth/login.html)

## 9. `*ngFor` y `@for`

### Tradicional

```html
<li *ngFor="let item of items">
  {{ item.name }}
</li>
```

### Angular 21

```html
@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No hay elementos.</li>
}
```

Usar siempre `track` con un identificador estable:

```html
track item.id
```

Esto ayuda a Angular a actualizar solamente los elementos que cambiaron.

## 10. `ngSwitch` y `@switch`

### Tradicional

```html
<div [ngSwitch]="role">
  <span *ngSwitchCase="'ADMINISTRATOR'">Administrador</span>
  <span *ngSwitchDefault>Usuario</span>
</div>
```

### Angular 21

```html
@switch (role()) {
  @case ('ADMINISTRATOR') {
    <span>Administrador</span>
  }
  @case ('EVALUATOR') {
    <span>Evaluador</span>
  }
  @default {
    <span>Usuario</span>
  }
}
```

