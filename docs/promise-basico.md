# Promise en el frontend

## ¿Qué es?

Una `Promise` representa una operación que termina más adelante.

Puede estar:

```text
pending   → esperando
fulfilled → terminó correctamente
rejected  → terminó con error
```

## Ejemplo simple

```ts
function obtenerMensaje(): Promise<string> {
  return Promise.resolve('Operación correcta');
}

const mensaje = await obtenerMensaje();
console.log(mensaje);
```

`await` espera el resultado antes de continuar.

## Errores

```ts
try {
  const resultado = await obtenerMensaje();
  console.log(resultado);
} catch (error) {
  console.error(error);
} finally {
  console.log('La operación terminó');
}
```

- `try`: intenta la operación.
- `catch`: recibe el error.
- `finally`: se ejecuta siempre.

## Ejemplo del login

En [`auth-session.ts`](../src/app/core/auth/auth-session.ts), el método `login` devuelve una Promise:

```ts
async login(credentials: LoginRequest): Promise<boolean> {
  this.clear();
  const response = await firstValueFrom(
    this.api.login(credentials)
  );

  sessionStorage.setItem(
    'access_token',
    response.access_token
  );

  this.token.set(response.access_token);
  return this.hydrate();
}
```

El flujo es:

```text
Esperar respuesta del login
        ↓
Guardar access_token
        ↓
Consultar el usuario actual
        ↓
Devolver true o false
```

El componente [`login.ts`](../src/app/features/auth/login.ts) espera esa Promise:

```ts
const authenticated = await this.session.login(
  this.form.getRawValue()
);

if (authenticated) {
  await this.router.navigateByUrl('/home');
}
```

## Estado de carga

Mientras la Promise está pendiente, el componente usa una signal:

```ts
readonly busy = signal(false);
```

```ts
this.busy.set(true);

try {
  await this.session.login(credentials);
} finally {
  this.busy.set(false);
}
```

Así el botón puede deshabilitarse mientras se espera:

```html
<button [disabled]="busy()">
  {{ busy() ? 'Ingresando…' : 'Ingresar' }}
</button>
```
