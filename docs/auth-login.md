# Login: guía de flujo

## Propósito y alcance

Permite iniciar sesión con una cuenta existente, restaurar la sesión al recargar y acceder a `/home`. Incluye autenticación, navegación y cierre local; excluye registro, recuperación de contraseña, renovación y autorización de negocio. Estado: implementación existente, con tests y build registrados en la revisión anterior. En esta simplificación se verificó el backend; no se volvieron a ejecutar tests ni build frontend. La integración real con backend y navegador queda pendiente.

## Prerrequisitos

- Angular/Material 21, TypeScript 5.9 y Vitest 4 según [package.json](../package.json); dependencias instaladas previamente. Backend NestJS 11 según su [manifiesto](../../backend/package.json).
- API disponible en `http://localhost:3001`, PostgreSQL y cliente Prisma preparados por el responsable del backend. No se ejecutaron instalaciones ni migraciones.
- El backend requiere `JWT_SECRET` y `JWT_EXPIRES_IN` (entero positivo en segundos), según [auth.config.ts](../../backend/src/auth/auth.config.ts). Nunca trasladar el secreto al frontend.
- Una cuenta de prueba autorizada y existente; esta guía no inventa credenciales. [UsersController](../../backend/src/users/users.controller.ts) expone creación y consulta **sin protección actualmente**, y permite solicitar `ADMINISTRATOR`. El alta es solo para desarrollo aislado/provisioning controlado; no es un registro público seguro.

## Lectura previa: del usuario al primer login

Si estás aprendiendo, empezá por [Users: entrada, hash y respuesta pública](../../doc/10-crear-modulo-users-nestjs-prisma.md) y seguí con [Auth: login y JWT paso a paso](../../doc/11-crear-modulo-auth-nestjs-prisma.md). El recorrido completo es crear una cuenta autorizada → `/auth/login` → guardar token → `/auth/me` → habilitar Home.

El backend ahora usa un tipo explícito `PublicUser` y `toPublicUser`: el tipo explica los campos; la función construye un objeto nuevo y evita filtrar `passwordHash` en ejecución. `password.ts` concentra generación y verificación scrypt sin cambiar hashes existentes. La consulta interna de login pide solo `id` y `passwordHash`; `/me` consulta por separado los datos públicos actuales. **No cambian las respuestas HTTP ni las decisiones de sesión del frontend.**

## Ubicación de carpetas y archivos

| Archivo | Responsabilidad | Estado |
|---|---|---|
| [auth-api.ts](../src/app/core/auth/auth-api.ts) | URL base, contratos tipados y HTTP | Implementado |
| [auth-session.ts](../src/app/core/auth/auth-session.ts) | Signals, persistencia y restauración | Implementado |
| [auth-interceptor.ts](../src/app/core/auth/auth-interceptor.ts) | Transporte Bearer y 401 | Implementado |
| [auth-guard.ts](../src/app/core/auth/auth-guard.ts) | Entrada a rutas protegidas | Implementado |
| [login.ts](../src/app/features/auth/login.ts), [HTML](../src/app/features/auth/login.html), [SCSS](../src/app/features/auth/login.scss) | Formulario y errores | Implementado |
| [home.ts](../src/app/features/home/home.ts) | Inicio protegido provisional | Implementado |
| [app.ts](../src/app/app.ts), [app.html](../src/app/app.html) | Shell, menú y logout | Actualizado |
| [app.routes.ts](../src/app/app.routes.ts), [app.config.ts](../src/app/app.config.ts) | Rutas, interceptor e inicialización | Actualizado |
| [styles.scss](../src/styles.scss) | Tokens y tema Material | Actualizado |
| [main.ts backend](../../backend/src/main.ts) | CORS, prefijo y Swagger | CORS agregado |

`core/auth/` contiene infraestructura global; `features/` contiene pantallas de negocio. No se crearon carpetas `shared/` ni `layout/`: todavía no hay componentes propios reutilizados que justifiquen esas extracciones. El shell sigue en `App`. Las pruebas se ubican junto al código; las guías en `frontend/docs/`.

## Arquitectura y límites

Componentes standalone → `AuthSession` → `AuthApi` → `HttpClient`. El interceptor consume la sesión solamente para transporte; la UI no recibe el token. No se introduce NgModule, NgRx ni una segunda capa de estado.

### Secuencia del flujo

1. `provideAppInitializer` llama a `hydrate()`. Sin token termina sin HTTP; con token consulta `/me` antes de habilitar una sesión autenticada.
2. El guard espera la misma hidratación compartida. Solo un usuario verificado habilita `/home`.
3. El formulario valida y envía credenciales sin recortarlas ni transformarlas.
4. `login()` limpia la sesión anterior, recibe el JWT y lo guarda en `sessionStorage`; después consulta `/me`.
5. Solo después de `/me` exitoso se publica el usuario y se navega a `/home`.
6. Un 401 de la API limpia la sesión y navega a `/login`. Un contador de generación evita que una hidratación anterior restaure el usuario después de logout; el interceptor ignora un 401 asociado a un token anterior.
7. `App.logout()` limpia signals y almacenamiento y vuelve a `/login`, sin llamar al servidor.

## Creación o extensión del módulo/componente

Para otra pantalla protegida, crear un standalone bajo `features/`, registrarlo con `loadComponent` y `canActivate: [authGuard]`, siguiendo `home.ts` y `app.routes.ts`. Consultar `session.user()` para presentación, no para conceder permisos de servidor. Reutilizar `mat-form-field`, `matInput`, `mat-error`, botones y tokens existentes; extraer UI a `shared/` solamente cuando tenga consumidores reales.

## API, servicio HTTP y JWT

| Operación | Método/ruta | Método frontend | Request / response | Errores |
|---|---|---|---|---|
| Login | `POST /api/v1/auth/login` | `AuthApi.login(credentials)` | `{ username: string, password: string }` → `{ access_token: string, token_type: 'Bearer', expires_in: number }` | 400 validación; 401 credenciales |
| Usuario actual | `GET /api/v1/auth/me` | `AuthApi.me()` | Sin body → `{ id, username, role, createdAt, updatedAt }` | 401 token inválido, expirado o usuario inexistente |

Evidencia: [AuthController](../../backend/src/auth/auth.controller.ts), [AuthService](../../backend/src/auth/auth.service.ts), [LoginDto](../../backend/src/auth/dto/login.dto.ts), [JwtStrategy](../../backend/src/auth/jwt.strategy.ts) y [UsersService](../../backend/src/users/users.service.ts). Las fechas viajan como strings JSON; `role` es `ADMINISTRATOR | EVALUATOR`, según [schema.prisma](../../backend/prisma/schema.prisma). No se devuelven contraseña ni hash. El backend firma `sub` y agrega tiempos JWT; el frontend no decodifica ni inventa claims.

- `API_BASE_URL` es un `InjectionToken` con default absoluto `http://localhost:3001/api/v1`. Para otro despliegue, proveer `{ provide: API_BASE_URL, useValue: 'https://api.example.org/api/v1' }` en `app.config.ts`, usando el origen real autorizado y sin barra final. No es una variable de entorno automática.
- Los servicios devuelven observables tipados, con timeout de 10 segundos; la sesión consume con `firstValueFrom`. No hay reintentos automáticos ni refresh token. El timeout cancela la suscripción HTTP; logout invalida resultados pendientes, no cancela su transporte.
- Solo `access_token` se persiste, en `sessionStorage`, por decisión explícita. Usuario y contraseña no se persisten. La contraseña se limpia al terminar el intento.
- El interceptor compara origen exacto y límite de ruta `/api/v1`; no envía Bearer a terceros, assets ni rutas con prefijos parecidos. Las URLs relativas se resuelven contra el documento real, no contra el origen del backend.
- No hay cookies ni `withCredentials`. `sessionStorage` limita persistencia a la sesión de pestaña, pero es accesible por JavaScript: **no protege contra XSS**. Usar HTTPS en producción, evitar HTML inseguro y no registrar requests de autenticación ni headers.
- `expires_in` describe la duración; no se usa como temporizador local. Una sesión ya cargada puede verse autenticada hasta que una petición devuelva 401. El servidor valida expiración y autorización; el guard no es una frontera de seguridad.
- **El backend no tiene endpoint de logout ni revocación.** Borrar el token local no invalida una copia robada: continúa válida hasta su expiración. Tampoco hay renovación implementada.

### CORS

[main.ts](../../backend/src/main.ts) habilita `origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200'`. `FRONTEND_ORIGIN` debe ser un origen exacto, sin path; no configurar comodines en producción. No se habilitan credenciales de cookies. Se preservan `/api/v1`, validación global y Swagger en `/api/v1/docs`. No se agrega proxy Angular. CORS es una política del navegador, no autorización de la API; su preflight real está pendiente de verificar.

## Signals y estado

`AuthSession` es singleton. `token` y `currentUser` son signals privados, `user` es readonly y `authenticated` es `computed`. No hacen falta effects. `Login` mantiene `busy` y `error` como signals y valores de entrada en formularios reactivos. `pending` deduplica hidrataciones simultáneas. No hay estado de datos vacío en login; en Home se muestra un placeholder, no datos ficticios.

## Routing y navegación

`/login` es pública; `/home` usa guard y carga diferida. `/` y rutas desconocidas redirigen a `/home`, que deriva a login si no hay sesión. No existe `returnUrl`: el éxito siempre lleva a Home. El menú muestra Sign in anónimo y Home/Sign out autenticado. El acceso directo y la recarga dependen de `/me`; el hosting debe servir `index.html` para rutas SPA. Visitar `/login` con sesión vigente sigue permitido.

## Validación y errores

| Caso | Comportamiento | Recuperación |
|---|---|---|
| Username vacío o solo espacios | Cliente impide envío; `mat-error` | Completar campo |
| Password menor a 8 caracteres o solo espacios | Cliente impide envío; backend valida nuevamente | Corregir sin recorte automático |
| 401 en login | Mensaje genérico «Invalid username or password.» | Reintentar; no identifica cuentas existentes |
| 400, red, CORS, timeout, 5xx en login | Mensaje genérico sin body del servidor | Revisar disponibilidad/configuración y reintentar |
| Error en `/me`, incluso 403 o red | Hidratación falla cerrada y limpia sesión | Iniciar sesión nuevamente |
| 401 de API con sesión actual | Interceptor limpia y redirige | Reautenticarse |
| 403 fuera de hidratación | Interceptor propaga sin limpiar sesión | El consumidor debe explicar falta de permisos |
| Storage bloqueado | Lectura inicia anónimo; escritura impide login | Habilitar almacenamiento de sesión |
| Envío repetido mientras carga | Se ignora; botón deshabilitado | Esperar hasta 10 segundos por petición |

Si el navegador impide `removeItem`, se limpian signals igualmente, pero no se puede garantizar el borrado físico: revisar la política del navegador. Nunca se muestra el error técnico ni el token.

## UI responsive y reutilizable

Se conservan los tres colores EAFI azul `#001082`, amarillo `#ffe600` y blanco `#ffffff`, centralizados en tokens. Se agrega `--eafi-form-width`; botones usan amarillo/azul, errores azul con texto explícito, sin incorporar rojo. No se agrega ni reemplaza un logo; se preserva el rótulo del shell existente.

El formulario ocupa el ancho disponible hasta el token de 30rem; gutters fluidos y menú con wrap permiten móvil/tablet/escritorio. Material conecta etiquetas y errores; se usan autocomplete, password oculto, `role="alert"`, estado anunciado y `aria-busy`. Se conserva skip-link y foco visible. No se agregan animaciones. **Pendientes:** revisión visual a 320/768/1280px, zoom 200%, contraste efectivo de Material, teclado y lector de pantalla; no hay evidencia de navegador todavía.

## Reproducción paso a paso

Comandos respaldados por los scripts de los manifiestos; **no ejecutados en esta implementación**. Requieren entorno y cuenta provisionados; no ejecutar migraciones ni crear administradores como parte de esta guía.

1. Configurar de forma segura las variables backend requeridas, conexión a base de datos y `FRONTEND_ORIGIN=http://localhost:4200` (default). No copiar secretos al repositorio.
2. En una terminal: `cd backend && npm run start:dev`.
3. En otra terminal: `cd frontend && npm start`.
4. Abrir `http://localhost:4200/home`: sin sesión debe redirigir a login.
5. Ingresar la cuenta autorizada. Esperar login 200 y `/me` 200; comprobar Home sin copiar tokens ni headers a capturas.
6. Recargar: comprobar `/me` y conservación del usuario. Salir: comprobar navegación a login y eliminación de la clave, sin imprimir su valor.
7. Probar credenciales incorrectas, API detenida y token expirado; confirmar mensajes genéricos y ausencia de acceso protegido. Comprobar CORS desde el origen autorizado.

## Pruebas y verificación

| Nivel | Archivo | Comando desde frontend | Resultado |
|---|---|---|---|
| Contrato HTTP, storage, hidratación, guard, aislamiento de headers, 401/403 y carreras | [auth.spec.ts](../src/app/core/auth/auth.spec.ts) | `npm test -- --watch=false --include='src/app/core/auth/auth.spec.ts'` | Histórico: parte de 13 tests aprobados en conjunto; no reejecutado |
| Validación, error, contraseña y doble envío | [login.spec.ts](../src/app/features/auth/login.spec.ts) | `npm test -- --watch=false --include='src/app/features/auth/login.spec.ts'` | Histórico: incluido en esos 13; no reejecutado |
| Shell y logout | [app.spec.ts](../src/app/app.spec.ts) | `npm test -- --watch=false --include='src/app/app.spec.ts'` | Histórico: incluido en esos 13; no reejecutado |
| Compilación y budgets | [angular.json](../angular.json) | `npm run build -- --delete-output-path=false` | Histórico: aprobado; no reejecutado |
| Backend mockeado | [Guía Auth: comandos y resultados](../../doc/11-crear-modulo-auth-nestjs-prisma.md#9-tests-ejecutados-y-qué-demuestran) | Desde backend, comandos registrados en la guía | Esta revisión: Users 22 y Auth 34 tests aprobados |
| Integración real y CORS | [main.ts](../../backend/src/main.ts) | No ejecutado | Pendiente; los contratos HTTP se conservan |

Los tests usan valores ficticios, nunca credenciales reales. Strict TDD no fue activado explícitamente para esta delegación: no hay evidencia RED/GREEN. La revisión anterior registró 13 tests frontend en conjunto y build aprobado con salida en `frontend/dist/frontend`; esos resultados son históricos, no una ejecución nueva ni 13 tests por archivo. En esta revisión se leyeron las tres suites, pero no se ejecutó Angular: su builder puede generar caché/salida fuera del único archivo frontend autorizado (`frontend/docs/auth-login.md`). El build tampoco se reejecutó. Queda pendiente revalidarlos con un alcance que permita esos artefactos.

### Checklist

- [x] Propósito, alcance, carpetas y responsabilidades documentados.
- [x] Contratos y roles contrastados con fuentes backend; ningún secreto incluido.
- [x] Servicio, signals, guard, interceptor, CORS y logout local explicados.
- [x] Extensión standalone, UI reutilizable, errores y pasos de reproducción cubiertos.
- [x] Tests escritos diferenciados de validación ejecutada.
- [ ] Reejecutar tests y build frontend para esta revisión (los resultados anteriores son históricos).
- [ ] Verificar login, `/me`, expiración, logout y preflight contra backend real.
- [ ] Validar responsive, accesibilidad y estilos Material en navegador.
- [ ] Verificar automáticamente todos los enlaces relativos.

## Referencias cruzadas y pendientes

Fuentes enlazadas en las tablas anteriores. Para entender el servidor sin tipos avanzados, consultá las guías [Users](../../doc/10-crear-modulo-users-nestjs-prisma.md) y [Auth](../../doc/11-crear-modulo-auth-nestjs-prisma.md). Pendientes de despliegue: origen API definitivo, HTTPS, hosting SPA, revisión de exposición de creación de usuarios y política de duración/revocación del backend. No se cambian esas políticas desde el frontend.
