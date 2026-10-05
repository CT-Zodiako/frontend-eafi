# Mis proyectos asignados (evaluador): guía de flujo implementado

> Este flujo está **implementado**. Existen la ruta Angular `/evaluator/projects`, la página, el servicio HTTP y el endpoint de backend `GET /api/v1/evaluator/projects`. El diagrama Archify enlazado más abajo conserva su rótulo original **"PROPUESTO"**: es una **instantánea histórica de diseño**, previa a la implementación, y ya no refleja el estado actual del código. Esta guía documenta el comportamiento real verificado contra el código fuente.

## Propósito y alcance

- **Objetivo:** permitir que un usuario con rol `EVALUATOR` vea únicamente los proyectos donde está asignado como evaluador (`ProjectEvaluator.evaluatorId = usuario actual`).
- **Tipo de guía:** flujo.
- **Incluye:** navegación, guard de rol, llamada HTTP real, autorización y filtrado de datos, estados de carga/error/vacío, UI responsive y accesibilidad, pruebas observadas.
- **Excluye:** CRUD completo de proyectos, UI de evaluación (calificar, comentar) en sí misma.
- **Resultado esperado:** un evaluador autenticado ve su lista de proyectos asignados (o un estado vacío si no tiene ninguno); un administrador o un usuario sin sesión no accede a esta pantalla.
- **Estado:** implementado. Verificado contra el código real de backend (`backend-eafi/src/evaluator/`), frontend (`frontend-eafi/src/app/features/evaluator/`), rutas (`app.routes.ts`, `app.ts`) y pruebas automatizadas. **No verificado:** navegación manual en navegador ni datos reales contra la base Railway configurada.

## Prerrequisitos

- Infraestructura de auth ya implementada: login, `/auth/me`, `AuthSession`, `authInterceptor`, `roleGuard` (frontend) y `JwtAuthGuard` + `RolesGuard` (backend).
- Conocer el flujo de roles existente: ver [`modulo-usuarios-flujo.md`](./modulo-usuarios-flujo.md) para un ejemplo end-to-end con los mismos guards.
- Existe en Prisma un modelo `ProjectEvaluator` que vincula `projectId` + `evaluatorId` (ver `backend-eafi/prisma/schema.prisma`), usado como fuente del filtro real.
- `JwtStrategy.validate` (ver [`jwt.strategy.ts`](../../backend-eafi/src/auth/jwt.strategy.ts)) resuelve el `sub` del JWT contra `UsersService.findOne`, de modo que `req.user.id` en el controller es el **id de base de datos** del usuario autenticado, no un valor crudo del token.

## Ubicación de carpetas y archivos

| Ruta enlazada | Responsabilidad | Estado |
|---|---|---|
| [`app.routes.ts`](../src/app/app.routes.ts) | Registra la ruta `/evaluator/projects` con `roleGuard` y `data: { roles: ['EVALUATOR'] }`, carga `EvaluatorProjects` de forma perezosa (`loadComponent`) | Implementado |
| [`app.ts`](../src/app/app.ts) | Agrega el ítem de navegación "Mis proyectos" → `/evaluator/projects`, visible solo para `['EVALUATOR']` | Implementado |
| [`evaluator-projects.ts`](../src/app/features/evaluator/evaluator-projects.ts) | Componente standalone: carga la lista, maneja `loading`/`error`/retry con signals | Implementado |
| [`evaluator-projects.html`](../src/app/features/evaluator/evaluator-projects.html) | Template: estados de carga, error con botón "Reintentar", vacío, grilla de tarjetas | Implementado |
| [`evaluator-projects.scss`](../src/app/features/evaluator/evaluator-projects.scss) | Grilla responsive (`auto-fill`) y estilos de tarjeta/error usando tokens de diseño (`--eafi-space-*`, `--eafi-color-*`) | Implementado |
| [`evaluator-projects-api.ts`](../src/app/features/evaluator/evaluator-projects-api.ts) | Servicio HTTP `EvaluatorProjectsApi.list()`, `GET {base}/evaluator/projects` con `timeout(10_000)` | Implementado |
| [`auth-session.ts`](../src/app/core/auth/auth-session.ts) | Sesión, JWT y `CurrentUser.role` | Existente, reutilizado sin cambios |
| [`auth-interceptor.ts`](../src/app/core/auth/auth-interceptor.ts) | Adjunta `Authorization: Bearer` y maneja 401 | Existente, reutilizado sin cambios |
| [`role-guard.ts`](../src/app/core/auth/role-guard.ts) | Bloquea navegación por rol, solo UI | Existente, reutilizado sin cambios |
| [`api-error.ts`](../src/app/core/auth/api-error.ts) | `apiErrorMessage()` centralizado, reutilizado por la página en lugar de duplicar lógica de mensajes | Existente, reutilizado |
| `backend-eafi/src/evaluator/evaluator.controller.ts` | `@Controller('evaluator')`, `GET /evaluator/projects`, `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(UserRole.EVALUATOR)` | Implementado |
| `backend-eafi/src/evaluator/evaluator.service.ts` | `findAssignedProjects(evaluatorId)`: filtra `Project` por `assignedEvaluators: { some: { evaluatorId } }` | Implementado |
| `backend-eafi/src/evaluator/evaluator.module.ts` | Registra el módulo con `PrismaModule` | Implementado |
| `backend-eafi/src/projects/projects.controller.ts` | CRUD general de proyectos | Existente, **sin guards de auth** (preexistente, fuera de alcance, ver abajo) |
| `backend-eafi/src/auth/roles.guard.ts`, `roles.decorator.ts` | `RolesGuard` + `@Roles()` reutilizados tal cual | Existente, reutilizado |
| `backend-eafi/src/auth/jwt.strategy.ts` | Resuelve `req.user` a partir del JWT contra la base de datos | Existente, reutilizado |

## Arquitectura y límites

- **Frontend:** la página vive en `features/evaluator/`, usa `EvaluatorProjectsApi` (servicio HTTP dedicado), y depende de `AuthSession`/`authInterceptor`/`roleGuard` igual que cualquier otra feature. El componente usa `signal()` para `projects`, `loading` y `error`, y `DestroyRef` para evitar actualizar estado tras destruirse.
- **Backend:** el endpoint real usa `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.EVALUATOR)`, y `EvaluatorService.findAssignedProjects` filtra por `request.user.id` (id de base de datos) contra `ProjectEvaluator`, sin devolver todos los proyectos.
- **Importante — alcance actual sin guards:** el `ProjectsController` general (`projects.controller.ts`) sigue **sin ningún guard** hoy; sus rutas CRUD (`POST/GET/PATCH/DELETE /projects`) están abiertas. Es un hecho preexistente del código, verificado nuevamente en esta revisión, no corregido por este flujo — se menciona como contexto de límite de seguridad existente, fuera de alcance.
- **Distinción clave entre infraestructura reutilizada y nueva:**
  - *Reutilizado sin cambios:* `/auth/me`, `AuthSession`, `roleGuard`, `authInterceptor`, `JwtAuthGuard`, `RolesGuard`, `apiErrorMessage`.
  - *Nuevo en este flujo:* el módulo `evaluator` completo en backend (controller + service + module) y la página `features/evaluator/` en frontend, incluyendo su servicio HTTP dedicado.

## Diagrama de secuencia (instantánea histórica de diseño)

Diagrama: [`evaluator-projects.html`](../../.archify/sequence-evaluator-projects-20261005-101936/evaluator-projects.html)

Este diagrama se generó **antes** de implementar el flujo y su título interno dice "PROPUESTO". Se conserva como referencia de diseño original, pero el recorrido real implementado es el que se describe a continuación; en caso de discrepancia, **el código fuente manda sobre el diagrama**.

### Recorrido camino feliz (implementado)

| Paso | De → a | Qué pasa | Dónde |
|---|---|---|---|
| 1 | Evaluador → navegador | Entra a la ruta `/evaluator/projects` (visible en el menú solo para `EVALUATOR`) | [`app.routes.ts`](../src/app/app.routes.ts), [`app.ts`](../src/app/app.ts) |
| 2 | `roleGuard` → `AuthSession` | `await session.hydrate()`; si no hay sesión, redirige a `/login` | [`role-guard.ts`](../src/app/core/auth/role-guard.ts) |
| 3 | `roleGuard` | Verifica `route.data['roles'].includes(session.user()?.role)`; si el rol es `EVALUATOR`, permite continuar | [`role-guard.ts`](../src/app/core/auth/role-guard.ts) |
| 4 | Página → servicio HTTP | El constructor del componente llama `load()`, que invoca `evaluatorProjectsApi.list()` | [`evaluator-projects.ts`](../src/app/features/evaluator/evaluator-projects.ts) |
| 5 | Interceptor | `authInterceptor` adjunta `Authorization: Bearer <token>` | [`auth-interceptor.ts`](../src/app/core/auth/auth-interceptor.ts) |
| 6 | HTTP → Controller | `GET /api/v1/evaluator/projects` con `timeout(10_000)` | [`evaluator-projects-api.ts`](../src/app/features/evaluator/evaluator-projects-api.ts), `backend-eafi/src/evaluator/evaluator.controller.ts` |
| 7 | Controller → guards | `JwtAuthGuard` resuelve el usuario vía `JwtStrategy.validate` (id de base de datos); `RolesGuard` exige `UserRole.EVALUATOR` | `backend-eafi/src/auth/jwt.strategy.ts`, `backend-eafi/src/evaluator/evaluator.controller.ts` |
| 8 | Controller → Service → PostgreSQL | `findAssignedProjects(evaluatorId)` filtra `Project` con `assignedEvaluators: { some: { evaluatorId } }`, seleccionando `id, name, description, categoryEditionId, createdAt, updatedAt` | `backend-eafi/src/evaluator/evaluator.service.ts` |
| 9 | Retorno en cadena | `200 OK` con la lista (o vacía) → Observable → `firstValueFrom` → `signal(projects)` → template repinta la grilla | [`evaluator-projects.ts`](../src/app/features/evaluator/evaluator-projects.ts), [`evaluator-projects.html`](../src/app/features/evaluator/evaluator-projects.html) |

### Casos alternativos y de error (implementados)

| Caso | Dónde se dispara | Comportamiento real |
|---|---|---|
| Sin sesión / token inválido | `roleGuard` (frontend) o `JwtAuthGuard` (backend) | Frontend redirige a `/login` antes de pedir datos; si el backend igual respondiera 401, `authInterceptor` limpia sesión y navega a `/login` |
| Rol incorrecto (ej. `ADMINISTRATOR` forzando la URL) | `roleGuard` en frontend (oculta el ítem de menú y bloquea la navegación) y `RolesGuard` en backend (403 real) | El guard de frontend es solo navegación; la autorización real la da el backend con 403, igual que en el patrón usado para `/users` |
| Evaluador autenticado sin proyectos asignados | Backend, tras filtrar por `evaluatorId` | Respuesta `200 OK` con lista vacía; la UI muestra `"No tenés proyectos asignados todavía."`, no un error |
| Error de red o timeout | `EvaluatorProjectsApi.list()` → `catch` en `load()` | `error.set(apiErrorMessage(error, 'evaluator-projects'))`; el template muestra `role="alert"` con el mensaje y un botón "Reintentar" que vuelve a llamar `load()` |

## API, servicio HTTP y JWT

| Operación | Método/ruta | Estado | Servicio/método frontend | Datos y respuesta | Errores |
|---|---|---|---|---|---|
| Listar proyectos asignados | `GET /api/v1/evaluator/projects` | **Implementado** | `EvaluatorProjectsApi.list()` | Lista de `EvaluatorProject { id, name, description, categoryEditionId, createdAt, updatedAt }` filtrada por `ProjectEvaluator.evaluatorId = usuario actual` | 401 (sin sesión), 403 (rol no evaluador), lista vacía `[]` si no hay asignaciones |

- **Configuración API:** reutiliza `API_BASE_URL` existente (ver [`api-config.ts`](../src/app/core/auth/api-config.ts)); sin config nueva.
- **Ubicación del JWT:** la misma ya existente, `sessionStorage` vía [`auth-session.ts`](../src/app/core/auth/auth-session.ts). Sin cambios de almacenamiento.
- **Límites de seguridad:** el `roleGuard` del frontend solo oculta la navegación. La autorización y el filtrado de datos por evaluador se resuelven en el backend (`RolesGuard` + filtro por `evaluatorId` en `EvaluatorService`); el frontend nunca debe confiar en el rol mostrado en UI como mecanismo de seguridad.
- **Payload de respuesta:** el backend usa `select` explícito en Prisma (`id, name, description, categoryEditionId, createdAt, updatedAt`); no expone campos adicionales del modelo `Project`.

## Validación y errores

| Caso | Dónde se detecta | Mensaje/comportamiento real | Recuperación |
|---|---|---|---|
| 401 (sesión vencida o inexistente) | `authInterceptor` (existente) | Limpia sesión, navega a `/login` | Reiniciar sesión |
| 403 (rol distinto de `EVALUATOR`) | Backend, `RolesGuard` | `apiErrorMessage(error, 'evaluator-projects')` genera el mensaje mostrado en `role="alert"` | Botón "Reintentar" visible; navegación manual a `/home` |
| Error de red/timeout | `EvaluatorProjectsApi.list()` (timeout 10s) | Igual que arriba: `role="alert"` + "Reintentar" | El botón vuelve a invocar `load()` |
| Lista vacía | Backend tras filtrar por `evaluatorId` | UI muestra `"No tenés proyectos asignados todavía."`, no es un error | No aplica |

## UI responsive y accesibilidad

- **Responsive:** `evaluator-projects.scss` define `.evaluator-projects-grid` con `display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr))`, que reacomoda tarjetas automáticamente según el ancho disponible sin media queries manuales.
- **Tokens de diseño:** usa variables `--eafi-space-*` y `--eafi-color-*` consistentes con el sistema de diseño EAFI, en vez de valores hardcodeados.
- **Accesibilidad:**
  - El estado de carga usa `<p role="status">Cargando proyectos…</p>`, anunciado por lectores de pantalla.
  - El estado de error usa `<div role="alert">`, que fuerza el anuncio inmediato del mensaje y el botón "Reintentar".
  - El título de la sección usa `<h1 id="evaluator-projects-title">` enlazado vía `aria-labelledby` en el `<section>` contenedor.
- **No verificado:** inspección manual en navegador real (DevTools, lectores de pantalla físicos, breakpoints visuales). Esta sección describe el marcado y CSS tal como están en el código, no una validación visual en vivo.

## Pruebas y verificación

| Nivel/caso | Archivo de prueba | Resultado observado |
|---|---|---|
| Backend: endpoint `GET /evaluator/projects` (e2e) | [`evaluator.e2e-spec.ts`](../../backend-eafi/test/evaluator.e2e-spec.ts) | **5/5 pasando**, reportado por el verificador independiente usando un *workaround* de mapper (ver nota abajo) |
| Frontend: componente `EvaluatorProjects` | [`evaluator-projects.spec.ts`](../src/app/features/evaluator/evaluator-projects.spec.ts) | Parte del total frontend **37/37 pasando** |
| Frontend: servicio `EvaluatorProjectsApi` | [`evaluator-projects-api.spec.ts`](../src/app/features/evaluator/evaluator-projects-api.spec.ts) | Parte del total frontend **37/37 pasando** |
| Build frontend | — | Build completo exitoso, reportado por el verificador independiente |

- **Nota sobre el *workaround* de mapper (backend):** las 5 pruebas e2e del backend pasaron usando un ajuste manual de mapeo en el entorno de test (no una configuración estándar del proyecto); esto es evidencia reportada por el flujo de verificación independiente de esta sesión, no algo reproducido ni reconfirmado en esta tarea de documentación.
- **No ejecutado en esta tarea:** ningún comando de prueba o build fue corrido para escribir esta guía; toda la evidencia de pruebas proviene de la verificación independiente ya registrada en el contexto de la sesión (backend 5/5, frontend 37/37 + build).
- **No verificado:** pruebas manuales en navegador, ni verificación contra datos reales de la base Railway configurada (el usuario evaluador de prueba no tiene asignación confirmada en `ProjectEvaluator`).

### Checklist

- [x] Propósito, prerrequisitos y alcance claros.
- [x] Rutas, símbolos y contratos API contrastados con código real; nada queda marcado como propuesta salvo el diagrama histórico, explícitamente etiquetado como tal.
- [x] Componente real documentado: ubicación, signals, dependencias, template.
- [x] Ubicación y recorrido JWT verificados contra código existente (incluye `JwtStrategy.validate` resolviendo id de base de datos); ningún secreto incluido.
- [x] Servicio HTTP, routing y validación cubiertos.
- [x] UI responsive y accesibilidad documentadas a partir del código (grilla `auto-fill`, `role="status"`, `role="alert"`, `aria-labelledby`); verificación visual en navegador marcada como no realizada.
- [x] Casos camino feliz, vacío y error (401/403/timeout) documentados.
- [x] Pruebas observadas documentadas con su alcance real (5/5 backend con workaround de mapper, 37/37 frontend, build exitoso); nada inventado ni re-ejecutado en esta tarea.
- [x] Enlaces relativos verificados desde esta guía (`frontend-eafi/docs/`).
- [x] Documentación relacionada (`modulo-usuarios-flujo.md`) preservada y referenciada.
- [x] Sin marcadores sin resolver; huecos (verificación manual, datos reales en Railway) marcados explícitamente.

## Referencias cruzadas y pendientes

- **Código fuente verificado:**
  - [`role-guard.ts`](../src/app/core/auth/role-guard.ts), [`auth-session.ts`](../src/app/core/auth/auth-session.ts), [`auth-interceptor.ts`](../src/app/core/auth/auth-interceptor.ts), [`api-error.ts`](../src/app/core/auth/api-error.ts)
  - [`evaluator-projects.ts`](../src/app/features/evaluator/evaluator-projects.ts), [`evaluator-projects.html`](../src/app/features/evaluator/evaluator-projects.html), [`evaluator-projects.scss`](../src/app/features/evaluator/evaluator-projects.scss), [`evaluator-projects-api.ts`](../src/app/features/evaluator/evaluator-projects-api.ts)
  - `backend-eafi/src/evaluator/evaluator.controller.ts`, `evaluator.service.ts`, `evaluator.module.ts`
  - `backend-eafi/src/auth/jwt.strategy.ts`, `roles.guard.ts`, `roles.decorator.ts`
  - `backend-eafi/src/projects/projects.controller.ts` (CRUD general, sin guards, preexistente)
  - `backend-eafi/prisma/schema.prisma` (modelo `ProjectEvaluator`, enum `UserRole`)
- **Diagrama (instantánea histórica, previa a la implementación, rotulada "PROPUESTO"):** [`evaluator-projects.html`](../../.archify/sequence-evaluator-projects-20261005-101936/evaluator-projects.html)
- **Guía relacionada:** [`modulo-usuarios-flujo.md`](./modulo-usuarios-flujo.md), patrón con los mismos guards.
- **Pendientes reales:**
  - Verificación manual en navegador (visual, mobile, lectores de pantalla) del flujo completo.
  - Confirmar con datos reales en Railway si el usuario evaluador de prueba tiene fila en `ProjectEvaluator` para validar el camino feliz con datos reales.
  - Decidir si el `ProjectsController` general gana guards (preexistente, fuera de alcance de este flujo).
