# ADR 0012: Protección de las rutas `/admin/*` con Routing Middleware

## Estado

Propuesto — surgió de la revisión adversarial; decidido por el agente sin entrevista. REVISAR.

## Contexto

Criterio de éxito del PRD: "cualquier request a `/admin` o `/api/admin/*` sin sesión válida
responde 401/redirección a login (verificable con test e2e)". `/admin` es parte de la SPA
estática: sin más, `GET /admin` devuelve 200 con `index.html` y la redirección ocurre recién en el
cliente, así que un test HTTP (curl, `request.get`) falla el criterio. Vercel Routing Middleware
funciona en proyectos que no son Next (`middleware.ts` en la raíz).

## Decisión

- `middleware.ts` con `matcher: ['/admin/:path*']`. Para toda ruta excepto `/admin/login`,
  verifica la firma y expiración de la cookie `__Host-lacers_admin` con el mismo módulo Web
  Crypto de ADR-0008 (sin acceso a DB). Si no es válida → **302 a `/admin/login?next=<ruta>`**.
- La SPA mantiene además su guard (`GET /api/admin/session`) para expiraciones durante el uso.
- Las páginas del admin se cargan con `React.lazy`: su código no viaja en el bundle de la
  landing.

## Alternativas consideradas

- **Solo redirección del lado cliente + enmienda del PRD** — cero infraestructura extra, pero
  obliga a reescribir un criterio de éxito y deja el HTML/JS del admin servible a cualquiera.
- **Servir el admin como una segunda app/Function que renderiza en servidor** — protección total,
  pero rompe la arquitectura SPA para un panel de tres pantallas.

## Consecuencias

- El criterio del PRD se cumple literalmente (302 verificable con un test HTTP).
- Una invocación de middleware por cada navegación a `/admin/*` (cuenta contra el cupo de Hobby;
  volumen ínfimo con un admin).
- El código de verificación de sesión debe ser compatible con el runtime del middleware (Web
  Crypto, sin `node:crypto`); verificarlo en la spike de ADR-0003.
- El middleware no reemplaza a `requireAdmin` en la API: son dos capas, y la API sigue siendo la
  que protege los datos.
