# Módulo de Usuarios: guía de flujo (listar y crear)




## Flujo 1 — Listar usuarios (carga inicial)

Diagrama: [`listar-usuarios.html`](../../.archify/sequence-listar-usuarios-20260928-092115/listar-usuarios.html)

| Mensaje | De → a | Qué pasa | Dónde en el código |
|---|---|---|---|
| `m1` | Administrador → UsersList | Entra a `/users` (ruta protegida por `roleGuard`, `data: { roles: ['ADMINISTRATOR'] }`) | [`app.routes.ts`](../src/app/app.routes.ts) |
| `m2` | UsersList → UsersApi | El `constructor()` de `UsersList` llama a `load()`, que invoca `usersApi.list()` | [`users-list.ts`](../src/app/features/users/users-list.ts) |
| `m3` | UsersApi → interceptor | `list()` hace `this.http.get<CurrentUser[]>(...)` | [`users-api.ts`](../src/app/features/users/users-api.ts) |
| `m4` | interceptor → Controller | `authInterceptor` clona el request y agrega `Authorization: Bearer <token>` | [`auth-interceptor.ts`](../src/app/core/auth/auth-interceptor.ts) |
| — | Controller → guards | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(ADMINISTRATOR)` en `GET /users` | `users.controller.ts` |
| `m5` | Controller → Service | `usersService.findAll()` | `users.controller.ts` |
| `m6` | Service → PostgreSQL | `prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: {...} })` | `users.service.ts` |
| `m7`–`m10` | retorno en cadena | Filas → `PublicUser[]` (sin `passwordHash`) → `200 OK` → `Observable<CurrentUser[]>` | `users.service.ts` → `users-api.ts` |
| `m11` | UsersList → Administrador | La signal `users` se actualiza y Angular repinta la tabla | [`users-list.html`](../src/app/features/users/users-list.html) |

## Flujo 2 — Crear usuario (modal)

Diagrama: [`crear-usuario.html`](../../.archify/sequence-crear-usuario-20260928-092115/crear-usuario.html)

| Mensaje | De → a | Qué pasa | Dónde en el código |
|---|---|---|---|
| `m1` | Administrador → UsersList | Clic en el botón «Crear» | [`users-list.html`](../src/app/features/users/users-list.html) |
| `m2` | UsersList → CreateDialog | `openCreateDialog()` llama a `this.dialog.open(CreateUserDialog)` | [`users-list.ts`](../src/app/features/users/users-list.ts) |
| `m3`–`m4` | diálogo con el admin | Se muestra el formulario reactivo (`username`, `password`, `role`); el admin lo completa y confirma | [`create-user-dialog.html`](../src/app/features/users/create-user-dialog.html) |
| `m5` | CreateDialog → UsersApi | `submit()` valida el form y llama a `usersApi.create(dto)` | [`create-user-dialog.ts`](../src/app/features/users/create-user-dialog.ts) |
| `m6` | UsersApi → interceptor | `create()` hace `this.http.post<CurrentUser>(...)` | [`users-api.ts`](../src/app/features/users/users-api.ts) |
| `m7` | interceptor → Controller | Igual que en el listado: adjunta el Bearer token | [`auth-interceptor.ts`](../src/app/core/auth/auth-interceptor.ts) |
| — | Controller → guards | Mismos guards que `GET /users`, ahora sobre `POST /users` | `users.controller.ts` |
| `m8` | Controller → Service | `usersService.create(dto)` | `users.controller.ts` |
| `m9` | Service → PostgreSQL | `hashPassword(dto.password)` (scrypt) + `prisma.user.create({...})` | `users.service.ts`, `auth/password.ts` |
| `m10` | PostgreSQL → Service | Usuario creado, **o** error `P2002` (Prisma) si el `username` ya existe | `users.service.ts` |
| `m11` | Service → Controller | `PublicUser` creado, o el servicio traduce `P2002` a `ConflictException` (409) | `users.service.ts` |
| `m12`–`m13` | retorno | `201 Created` → promesa resuelta en el diálogo | `users-api.ts` → `create-user-dialog.ts` |
| `m14` | CreateDialog → UsersList | `dialogRef.close(true)` | `create-user-dialog.ts` |
| `m15`–`m16` | UsersList → UsersApi → UsersList | `afterClosed()` recibe `true` y vuelve a llamar `load()`; la tabla se actualiza sola, sin recargar la página | `users-list.ts` |

## API, servicio HTTP y JWT

| Operación | Método/ruta verificados | Servicio/método frontend | Datos y respuesta | Errores |
|---|---|---|---|---|
| Listar usuarios | `GET /users` (backend, `@Roles(ADMINISTRATOR)`) | [`UsersApi.list()`](../src/app/features/users/users-api.ts) | `CurrentUser[]` (`id, username, role, createdAt, updatedAt`) | 401/403 → interceptor o `apiErrorMessage(error, 'users')` |
| Crear usuario | `POST /users` (backend, `@Roles(ADMINISTRATOR)`) | [`UsersApi.create()`](../src/app/features/users/users-api.ts) | body `{ username, password, role }` → `CurrentUser` | 409 username duplicado, 400 validación DTO, 401/403 |

- **Configuración API:** `API_BASE_URL` sale de `environment.apiBaseUrl` (ver [`api-config.ts`](../src/app/core/auth/api-config.ts)); en desarrollo apunta a `http://localhost:3001/api/v1`.
- **Uso HTTP:** `UsersApi` usa `HttpClient` tipado (`this.http.get<CurrentUser[]>`, `this.http.post<CurrentUser>`), con `.pipe(timeout(10_000))` en ambos métodos.
- **Ubicación del JWT:** `sessionStorage.getItem('access_token')`, leído y escrito en [`auth-session.ts`](../src/app/core/auth/auth-session.ts).
- **Flujo JWT:** login (`AuthSession.login()`) → `sessionStorage.setItem('access_token', ...)` → cada request pasa por `authInterceptor`, que agrega el header solo si la URL es de la API → si el backend responde 401, `authInterceptor` limpia la sesión y navega a `/login`.
- **Límites de seguridad:** el frontend solo oculta UI (`roleGuard`, `visibleItems()` del sidebar). La autorización real siempre la decide `RolesGuard` en el backend; un usuario sin rol `ADMINISTRATOR` que fuerce la URL recibe 403 del backend aunque hubiera podido ver el botón.

## Signals y estado

- `UsersList.users`, `UsersList.loading`, `UsersList.error`: signals mutables, seteadas dentro de `load()`.
- `UsersList` dispara `load()` en su propio `constructor()` (no en `ngOnInit`), siguiendo el patrón ya usado en este repo.
- No hay `effect()` en este flujo: la sincronización con el modal se hace con el callback de `afterClosed()`, no con un `effect` observando un signal.
- Estados cubiertos en el template: `loading()` → "Cargando usuarios…"; `error()` → alerta; lista vacía → mensaje; éxito → tabla.

## Routing y navegación

- Ruta real: `{ path: 'users', canActivate: [roleGuard], data: { roles: ['ADMINISTRATOR'] }, loadComponent: () => import('./features/users/users-list')... }` en [`app.routes.ts`](../src/app/app.routes.ts).
- Carga diferida (`loadComponent`): el chunk `users-list` solo se descarga cuando se visita `/users`.
- Sin parámetros ni query params en esta ruta.
- Acceso directo a `/users` sin sesión: `roleGuard` llama a `session.hydrate()`; si falla, redirige a `/login`. Sin rol `ADMINISTRATOR`: redirige a `/home`.

## Validación y errores

| Caso | Dónde se detecta | Respuesta o mensaje | Recuperación |
|---|---|---|---|
| Username vacío o solo espacios | Cliente (`Validators.pattern(/\S/)`) | Mensaje bajo el campo | Corregir y reintentar |
| Password < 8 caracteres | Cliente (`Validators.minLength(8)`) | Mensaje bajo el campo | Corregir y reintentar |
| Username duplicado | Servidor (`P2002` de Prisma → `ConflictException`) | `apiErrorMessage(error, 'users')` → "Ese nombre de usuario ya está en uso." | El modal sigue abierto y editable |
| Token vencido (401) durante `list()` o `create()` | Servidor, capturado por `authInterceptor` | Sesión limpiada, redirección a `/login` | Volver a iniciar sesión |
| Falla de red o timeout (10s) | Cliente (`rxjs.timeout`) | Mensaje genérico de `apiErrorMessage` | Reintentar la acción |

## UI responsive y reutilizable

- La tabla y el botón «Crear» usan los tokens de diseño existentes (`--eafi-space-*`, `--eafi-radius`, `--eafi-color-border`); ver [`users-list.scss`](../src/app/features/users/users-list.scss).
- El modal usa `MatDialog` de Angular Material, que ya maneja overlay, foco y cierre con `Escape` de forma accesible sin código adicional.
- No se agregaron breakpoints nuevos para este módulo: la tabla es de ancho completo y el modal se adapta al viewport por comportamiento estándar de `MatDialog`.
- Mensajes de error (`role="alert"`) y de carga (`role="status"`) siguen el mismo patrón accesible que `Login`.

## Reproducción paso a paso

1. Backend: `cd backend-eafi && npm run start:dev` (requiere `DATABASE_URL` configurado).
2. Frontend: `cd frontend-eafi && npx ng serve` (o el puerto que uses; ajustar `FRONTEND_ORIGIN` del backend si no es `4200`).
3. Ir a `/login`, entrar con un usuario `ADMINISTRATOR`.
4. Ir a `/users` (o clic en «Usuarios» en el sidebar): debería aparecer la tabla con todos los usuarios.
5. Clic en «Crear», completar usuario/contraseña/rol, confirmar: el modal se cierra y el usuario nuevo aparece primero en la tabla, sin recargar la página.
6. Caso alternativo: repetir el mismo username → el modal muestra "Ese nombre de usuario ya está en uso." y no se cierra.

## Pruebas y verificación

| Nivel/caso | Archivo de prueba enlazado | Comando y directorio | Resultado observado o pendiente |
|---|---|---|---|
| Unitaria — listado y error | [`users-list.spec.ts`](../src/app/features/users/users-list.spec.ts) | `npx ng test --watch=false` en `frontend-eafi/` | Observado: pasa |
| Unitaria — alta y duplicado | [`create-user-dialog.spec.ts`](../src/app/features/users/create-user-dialog.spec.ts) | `npx ng test --watch=false` en `frontend-eafi/` | Observado: pasa |
| Unitaria — backend `findAll`/`create` | `../../backend-eafi/test/users.service.spec.ts` | `npm run test:users` en `backend-eafi/` | Observado: pasa (25/25) |
| E2E manual en navegador | — | Pasos de [Reproducción](#reproducción-paso-a-paso) | Observado: login, listado, alta y duplicado verificados en Chrome real |

### Checklist

- [x] Propósito, prerrequisitos y alcance claros.
- [x] Rutas, símbolos, contratos API y límites contrastados con código.
- [x] Creación/reutilización de componentes explicada (`MatDialog`, sin componentes nuevos de UI genérica).
- [x] Ubicación y recorrido JWT verificados; ningún secreto incluido.
- [x] Servicio HTTP, signals, routing y validación cubiertos.
- [x] UI responsive, reutilización y accesibilidad comprobadas (comportamiento estándar de Angular Material, sin breakpoints propios).
- [x] Pasos reproducibles con resultados esperados, incluido el error de username duplicado.
- [x] Pruebas ejecutadas diferenciadas de las pendientes.
- [x] Enlaces relativos resueltos desde esta guía (`frontend-eafi/docs/`).
- [x] Documentación relacionada preservada; se referencia `observable-basico.md`.
- [x] Sin marcadores sin resolver.

## Referencias cruzadas y pendientes

- **Código fuente:** ver tabla de [Ubicación de carpetas y archivos](#ubicación-de-carpetas-y-archivos).
- **Guías relacionadas:** [`observable-basico.md`](./observable-basico.md) (para entender `Observable` antes de leer `users-api.ts`).
- **Diagramas:** [`listar-usuarios.html`](../../.archify/sequence-listar-usuarios-20260928-092115/listar-usuarios.html), [`crear-usuario.html`](../../.archify/sequence-crear-usuario-20260928-092115/crear-usuario.html).
- **Decisiones pendientes:** no hay endpoints de edición ni borrado de usuarios; si se agregan, esta guía debe ampliarse con un tercer flujo.
