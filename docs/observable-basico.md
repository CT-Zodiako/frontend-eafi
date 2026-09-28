# Observable en el frontend

## ¿Qué es RxJS?

RxJS significa **Reactive Extensions for JavaScript**. Es una librería para trabajar con datos que llegan en el tiempo mediante `Observable`.

RxJS permite:

- Escuchar eventos.
- Transformar datos.
- Combinar varias operaciones.
- Manejar errores.
- Cancelar o controlar suscripciones.
- Trabajar con peticiones HTTP.

Angular utiliza RxJS en `HttpClient`, formularios reactivos y otras APIs.


## ¿Qué es?

Un `Observable` representa un flujo de datos al que nos podemos suscribir.

Puede emitir:

```text
next     → entregó un valor
error    → ocurrió un error
complete → no habrá más valores
```

## Ejemplo simple

```ts
import { of } from 'rxjs';

const mensaje$ = of('Hola');

mensaje$.subscribe({
  next: mensaje => console.log(mensaje),
  error: error => console.error(error),
  complete: () => console.log('Terminó'),
});
```

El signo `$` es una convención para indicar que una variable es un Observable.

## Observable en un servicio Angular

En [`auth-api.ts`](../src/app/core/auth/auth-api.ts), `HttpClient` devuelve Observables:

```ts
login(credentials: LoginRequest) {
  return this.http.post<LoginResponse>(
    `${this.base}/auth/login`,
    credentials
  );
}

me() {
  return this.http.get<CurrentUser>(
    `${this.base}/auth/me`
  );
}
```

El servicio se ocupa de:

- Conocer la URL de la API.
- Hacer la petición HTTP.
- Definir el tipo de respuesta.

No se ocupa de mostrar mensajes ni navegar.

## ¿Dónde se consume?

`AuthSession` convierte el Observable en Promise con `firstValueFrom`:

```ts
const response = await firstValueFrom(
  this.api.login(credentials)
);
```


Se hace así porque el login es una operación puntual: esperamos una respuesta y continuamos.
