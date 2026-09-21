# Login y sesión: guía de flujo

## Propósito y alcance

Login, restauración con `/me`, navegación y logout local. Incluye presentación por rol; la autorización real pertenece al backend. No incluye registro público, refresh, revocación ni pantallas de negocio nuevas. Tests y builds automatizados aprobados; integración real y navegador pendientes.

## Prerrequisitos

Angular/Material 21 y dependencias existentes en [package.json](../package.json). Backend NestJS, PostgreSQL y Prisma preparados por el responsable del entorno; cuenta de prueba provisionada de forma controlada. El backend requiere `JWT_SECRET` y `JWT_EXPIRES_IN`; nunca copiarlos al frontend. Ver [guía Auth](../../doc/11-crear-modulo-auth-nestjs-prisma.md).

`POST /api/v1/users` requiere un administrador autenticado. El primer administrador debe existir mediante provisioning controlado: no se agregó un bypass ni un registro público. `GET /users/:id` conserva su comportamiento anterior, fuera del alcance de este cambio.

## Ubicación y límites

| Fuente | Responsabilidad |
|---|---|
| [auth-api.ts](../src/app/core/auth/auth-api.ts) | Contratos y llamadas HTTP |
| [api-config.ts](../src/app/core/auth/api-config.ts) | Token inyectable API_BASE_URL |
| [environment.ts](../src/environments/environment.ts), [environment.development.ts](../src/environments/environment.development.ts) | URL de producción/desarrollo |
| [auth-session.ts](../src/app/core/auth/auth-session.ts) | Signals, sessionStorage, hidratación compartida |
| [auth-interceptor.ts](../src/app/core/auth/auth-interceptor.ts) | Bearer limitado a la API y tratamiento de 401 |
| [api-error.ts](../src/app/core/auth/api-error.ts) | Traducción segura de errores a mensajes |
| [auth-guard.ts](../src/app/core/auth/auth-guard.ts), [role-guard.ts](../src/app/core/auth/role-guard.ts) | Navegación autenticada y por rol |
| [navigation.ts](../src/app/layout/navigation.ts) | Menú reutilizable, identidad y logout |
| [login.ts](../src/app/features/auth/login.ts) | Formulario standalone |

`core/` contiene infraestructura; `layout/` contiene navegación; `features/` contiene pantallas. No se introduce NgModule ni NgRx. El shell consume `Navigation`; no duplica su lógica. No se necesita `shared/` adicional para este flujo.

## API, URL y JWT paso a paso

1. `provideAppInitializer` y los guards llaman a `hydrate()`: sin token no hay petición; con token consultan `/auth/me`. Las llamadas simultáneas comparten la misma promesa.
2. Login valida username no vacío y contraseña de ocho caracteres como mínimo; no recorta credenciales. `POST /api/v1/auth/login` recibe `{ username, password }` y devuelve `{ access_token, token_type, expires_in }`.
3. Se guarda solamente `access_token` en `sessionStorage`. Después, `GET /api/v1/auth/me` obtiene `{ id, username, role, createdAt, updatedAt }`. Solo entonces se habilita Home.
4. El interceptor agrega Bearer únicamente al origen y límite de ruta de la API configurada. No lo envía a terceros ni a prefijos parecidos.
5. Un 401 de la sesión actual limpia estado y redirige a login. Respuestas tardías de sesiones anteriores no invalidan un login nuevo. Logout invalida hidrataciones pendientes y borra el token local; no revoca el JWT en el servidor.

[angular.json](../angular.json) reemplaza `environment.ts` por `environment.development.ts` para desarrollo: `http://localhost:3001/api/v1`. Producción usa el placeholder explícito `https://replace-before-deploy.invalid/api/v1`: **reemplazarlo por la URL HTTPS real antes del despliegue**. Son valores compilados, no variables de entorno leídas en tiempo de ejecución. No contienen secretos. El InjectionToken permite sobrescribir la URL en tests.

Las peticiones tienen timeout de diez segundos, sin reintentos ni refresh automático. `sessionStorage` es accesible desde JavaScript: no protege contra XSS. La contraseña se limpia al terminar el intento. Nunca registrar tokens, contraseñas, headers ni cuerpos de login.

## Signals, rutas y extensión

`AuthSession` mantiene token y usuario privados, `user` readonly y `authenticated` computed; `error` expone un mensaje seguro. Login conserva signals `busy` y `error`. No se agregan effects.

`/login` es pública; `/home` usa `authGuard`. Las rutas desconocidas vuelven a Home. El hosting debe soportar fallback SPA. No hay returnUrl.

Para una futura pantalla real, crear un standalone bajo `features/`. Si necesita roles, configurar `canActivate: [roleGuard]` y `data: { roles: ['ADMINISTRATOR'] }`. El guard hidrata primero; sin sesión redirige a login y sin rol permitido vuelve a Home. Metadata ausente o vacía deniega. Home sigue usando solo `authGuard` para evitar ciclos de redirección. Los roles vienen de `/me`, no de decodificar el JWT.

Pasar a `Navigation.items` entradas `{ label, path, roles }` solamente cuando sus rutas existan. Su computed filtra por el usuario actual. No se agregaron rutas ni opciones de negocio ficticias. Ocultar un enlace no reemplaza al guard, y ninguno reemplaza la autorización del servidor.

## Errores y recuperación

[apiErrorMessage](../src/app/core/auth/api-error.ts) centraliza mensajes sin mostrar el body del servidor:

| Caso | Resultado |
|---|---|
| 401 login | Credenciales inválidas, sin revelar si existe la cuenta |
| 401 sesión | Sesión expirada; volver a ingresar |
| 403 | Falta de permisos; el interceptor no cierra una sesión establecida |
| 400 | Revisar datos ingresados |
| Red/CORS (status 0) | Revisar conexión; no se puede distinguir CORS de red desde ese status |
| Timeout | Reintentar |
| 429 | Esperar antes de reintentar |
| 5xx | Servicio temporalmente no disponible |
| Error desconocido/storage | Mensaje genérico, sin detalles técnicos |

Si `/me` falla, la hidratación falla cerrada y limpia sesión incluso ante red o 403. Login muestra su mensaje mediante `role="alert"`. El interceptor conserva el aviso de expiración para la pantalla de login. Si el navegador bloquea `removeItem`, se limpia memoria pero no se garantiza borrado físico. El backend vuelve a validar entradas y permisos.

## UI responsive y reutilizable

El menú Material muestra username y rol, Home y Sign out; anónimo muestra Sign in. `Navigation` concentra logout y filtra futuras entradas por rol. Usa wrap y corte de usernames largos, con tokens de espaciado existentes. Se preservan azul, amarillo y blanco EAFI, el rótulo del shell, skip-link y foco global. No se agrega ni reemplaza un logo.

Material gestiona interacción de menú y teclado; el formulario conserva labels, autocomplete, `aria-busy`, alertas y bloqueo de envíos duplicados. Pendiente comprobar realmente teclado, foco del overlay, lector de pantalla, contraste, zoom 200% y tamaños 320/768/1280px.

## Reproducción propuesta, no ejecutada

1. Preparar backend/base y una cuenta administradora autorizada; no crear un bypass para el primer usuario.
2. Desde `backend-eafi`, iniciar el servidor con su script `npm run start:dev`; desde `frontend-eafi`, `npm start`.
3. Abrir `/home` sin sesión: esperar login. Ingresar credenciales: esperar login y `/me` exitosos.
4. Recargar, comprobar username/rol y abrir Menu; salir y comprobar redirección sin inspeccionar ni copiar el token.
5. Repetir con contraseña incorrecta, API detenida y sesión expirada; comprobar mensajes seguros.
6. Contra backend real, comprobar creación sin Bearer (401), con evaluador (403) y con administrador (201). No guardar credenciales ni tokens en capturas.

## Pruebas y verificación

Resultados informados por el padre:

- Backend users: 24 tests aprobados.
- Backend auth: 34 tests aprobados.
- Build backend: aprobado.
- Build frontend de producción: aprobado.
- Suite completa frontend: 25 tests aprobados en 6 archivos después de completar el mock de `AuthSession`.

- [auth.spec.ts](../src/app/core/auth/auth.spec.ts): sesión, aislamiento HTTP, carreras y guards.
- [login.spec.ts](../src/app/features/auth/login.spec.ts): formulario y errores.
- [app.spec.ts](../src/app/app.spec.ts): shell; requiere revisar expectativas tras extraer navegación.
- [users.e2e-spec.ts](../../backend-eafi/test/users.e2e-spec.ts): contratos con persistencia mockeada; no demuestra integración PostgreSQL.
- Pendientes: comprobar API/backend real, navegador, CORS/preflight, file replacements de producción en ejecución, responsive y accesibilidad.

Strict TDD no fue activado. La validación automatizada generó únicamente outputs locales ignorados por Git. Ver [guía backend](../../doc/11-crear-modulo-auth-nestjs-prisma.md) para el orden JwtAuthGuard → RolesGuard.
