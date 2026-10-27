# Technical Design Document: LACERS CNC — Cotizador Técnico con persistencia y Panel Admin

**Versión:** 2 (final, corregida tras la [revisión adversarial](REVISION-ADVERSARIAL-v1.md) de
la [v1](TECH-DESIGN-v1.md)) · 2026-10-26
**Tipo de proyecto:** Brownfield — repo revisado: este mismo (`src/`, `vercel.json`,
`package.json`, `tsconfig.json`, `CLAUDE.md`). **Reemplaza** a `TECH-DESIGN.md` y `adrs/` de la
raíz del repo, que respondían a un alcance anterior (panel de precios, mailto).
**Design.md disponible:** Sí — [docs/02-diseno/DESIGN.md](../02-diseno/DESIGN.md).
**PRD:** [docs/01-producto/PRD.md](../01-producto/PRD.md).

**Modo de generación:** sesión no interactiva. *Mandato* = fijado por el usuario/curso;
*heredado* = ya fijado en el repo o en `CLAUDE.md`; *Propuesto* = decidido por el agente,
pendiente de confirmación (`REVISAR`).

## Resumen

Se extiende la landing existente de LACERS (SPA Vite + React) para que el wizard de
`/cotizador-tecnico` deje de terminar en un mensaje de WhatsApp y pase a **registrar cada
solicitud en PostgreSQL (Neon)**. Cada solicitud lleva un cálculo preliminar (contracción por
polímero y tiempo de mecanizado) que se **recalcula en el servidor**, y se envía de forma
idempotente y con límite de tasa. Además se agrega un panel `/admin`, protegido por cookie
firmada y Routing Middleware, donde el ingeniero lista, busca, consulta y cambia el estado de
las solicitudes. Todo se despliega en Vercel free tier con Vercel Functions en `api/`. El
catálogo (aleaciones, procesos, polímeros, reglas de cálculo) sigue en código, como fija el PRD
en "No alcance".

## Arquitectura de componentes

| Componente | Estado | Responsabilidad |
|---|---|---|
| SPA `src/` (landing + `/cotizador-tecnico`) | Existe, se modifica | Wizard con borrador en `localStorage`, paso de contacto + privacidad, envío idempotente |
| SPA `src/pages/admin/*` (`React.lazy`) | Nuevo | Login, listado con filtro/búsqueda, detalle, cambio de estado |
| `src/lib/cotizador/` | Nuevo | Esquemas Zod (request/response), `calcularEstimacion`, `project_code`, `payload_hash` canónico. Puro y compartido |
| `src/data/catalog.ts` | Nuevo (re-exportado por `landingData.ts`) | Aleaciones (incl. `6061-t6`), procesos, `POLYMERS` unificado, coeficientes |
| `api/` | Nuevo | 8 Vercel Functions ([ADR-0006](adrs/0006-api-rest.md), [ADR-0013](adrs/0013-datos-personales-y-retencion.md)) |
| `server/` | Nuevo | Cliente Drizzle, sesión (Web Crypto), scrypt, rate limit, logging JSON |
| `middleware.ts` | Nuevo | 302 a login en `/admin/*` sin cookie válida ([ADR-0012](adrs/0012-proteccion-de-rutas-admin.md)) |
| Neon PostgreSQL | Nuevo | `quotes`, `admin_users`, `rate_limits`; ramas `main` (prod) y `dev` |
| Monitor externo | Nuevo | Consulta `GET /api/health` cada 5 min y alerta por email |

```
Browser (SPA)
  ├─ /cotizador-tecnico ── POST /api/quotes (Idempotency-Key) ─────────┐
  └─ /admin/* ──[middleware.ts: cookie válida? si no 302]──            │
                └─ /api/admin/* (cookie __Host-lacers_admin + Origin) ─┤
Vercel Cron (diario) ── GET /api/cron/retention (CRON_SECRET) ─────────┤
Monitor ── GET /api/health ────────────────────────────────────────────┤
                                                                       ▼
                         Vercel Functions (api/ + server/), misma región que Neon
                            │ Zod + calcularEstimacion (src/lib/cotizador)
                            │ Drizzle neon-http (@neondatabase/serverless)
                            ▼
                         Neon PostgreSQL (main | dev)
```

### Flujo de `POST /api/quotes`

1. Validar el header `Idempotency-Key` (UUID) y el body con Zod. Si falta la clave o el body es
   inválido, se incrementa el bucket de rate limit y se responde **400** con `fields` (o 429 si
   ya se superó el límite).
2. Calcular el `payload_hash` canónico y hacer `SELECT` por clave:
   - mismo hash → **200** replay;
   - hash distinto → **409** `IDEMPOTENCY_KEY_REUSED`.

   Los replays no consumen cupo.
3. Upsert atómico en `rate_limits`; si se superó el límite → **429**.
4. Si el honeypot vino con contenido, marcar `is_spam`.
5. Ejecutar `calcularEstimacion` en el servidor, que genera `pairs`, `project_code` y `public_code`.
6. `INSERT … ON CONFLICT (submission_key) DO NOTHING RETURNING`. Si no devuelve fila, volver al paso 2.
7. Responder **201** con `public_code`, la estimación persistida y `calcVersionChanged`.

### Configuración de plataforma

- `vercel.json`:
  - rewrite SPA `{"source": "/((?!api/).*)", "destination": "/index.html"}`;
  - `regions` igual a la región de Neon;
  - `crons: [{ "path": "/api/cron/retention", "schedule": "0 6 * * *" }]`;
  - headers de seguridad: `Content-Security-Policy: frame-ancestors 'none'`,
    `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`.
- Variables de entorno (solo servidor, nunca con prefijo `VITE_`): `DATABASE_URL`,
  `DATABASE_URL_UNPOOLED`, `SESSION_SECRET`, `SESSION_NOT_BEFORE` (opcional), `IP_HASH_SALT`,
  `CRON_SECRET`. Scope por entorno: Production → rama `main`; Preview y Development → rama `dev`.
- Build: `tsc --noEmit && tsc -p tsconfig.api.json --noEmit && vite build`
  ([ADR-0003](adrs/0003-componentes-monorepo-spa-y-functions.md)).

## Decisiones de arquitectura

| # | Decisión | Estado |
|---|---|---|
| [ADR-0001](adrs/0001-despliegue-vercel-free-tier.md) | Despliegue en Vercel free tier (+ límite de uso no comercial) | Aceptado (mandato) |
| [ADR-0002](adrs/0002-persistencia-neon-postgresql.md) | Persistencia en PostgreSQL (Neon), ramas `main`/`dev` | Aceptado (mandato) |
| [ADR-0003](adrs/0003-componentes-monorepo-spa-y-functions.md) | Monorepo SPA + Functions, reglas de módulos ESM | Aceptado (heredado) |
| [ADR-0004](adrs/0004-acceso-a-datos-drizzle-neon-serverless.md) | Drizzle sobre `@neondatabase/serverless`, flujo de migraciones | Reemplazado por ADR-0014 |
| [ADR-0014](adrs/0014-acceso-a-datos-prisma-neon.md) | Prisma 7 + `@prisma/adapter-neon`, migraciones Prisma, fallback en memoria fuera de producción | Aceptado |
| [ADR-0005](adrs/0005-modelo-de-datos-cotizaciones.md) | Modelo de datos y máquina de estados | Propuesto |
| [ADR-0006](adrs/0006-api-rest.md) | API REST | Aceptado (mandato) |
| [ADR-0007](adrs/0007-validacion-server-side-y-calculo-compartido.md) | Validación server-side + cálculo compartido | Aceptado (mandato) |
| [ADR-0008](adrs/0008-autenticacion-admin-cookie-firmada.md) | Auth admin por cookie firmada | Aceptado (mandato) |
| [ADR-0009](adrs/0009-idempotencia-en-cotizaciones.md) | Idempotencia en cotizaciones (`payload_hash`, 409) | Aceptado (mandato) |
| [ADR-0010](adrs/0010-proteccion-anti-spam-rate-limit.md) | Rate limit atómico + honeypot | Propuesto |
| [ADR-0011](adrs/0011-estado-cliente-y-resiliencia.md) | Estado del cliente, resiliencia y observabilidad | Propuesto |
| [ADR-0012](adrs/0012-proteccion-de-rutas-admin.md) | Protección de `/admin/*` con Routing Middleware | Propuesto |
| [ADR-0013](adrs/0013-datos-personales-y-retencion.md) | Datos personales: aviso, retención, anonimización | Propuesto |

En las decisiones con mandato, el *qué* lo fijó el usuario y el *cómo* (algoritmos, umbrales)
lo propuso el agente. Ese *cómo* también está marcado `REVISAR`.

## Modelo de datos

Detalle completo, con constraints, en [ADR-0005](adrs/0005-modelo-de-datos-cotizaciones.md).

- **`quotes`**:
  - identificación: `id`, `folio`, `public_code` (UNIQUE), `project_code`, `submission_key`
    (UNIQUE), `payload_hash`;
  - datos técnicos: `process_id`, `alloy_id?`, `polymer_id`, `geometry_mode`, `size_start`,
    `size_end`, `pairs` (CHECK), `note`;
  - contacto: `contact_name`, `contact_company?`, `contact_email?`, `contact_phone?`
    (CHECK de email o teléfono), `privacy_accepted_at`;
  - estimación: `shrinkage_pct`, `machining_hours_est`, `estimate_provisional`,
    `calc_version`, `is_special_case`, `special_reasons[]`;
  - gestión: `is_spam`, `status`, `status_changed_at`, `created_at`, `ip_hash?`,
    `anonymized_at?`.
- **`admin_users`**: `id`, `email` (UNIQUE), `password_hash`, `created_at`.
- **`rate_limits`**: `bucket` (PK), `window_start`, `hits`.

Cobertura de los elementos de DESIGN.md que implican datos:

| Elemento | Dónde sale |
|---|---|
| Badge de estado (rojo `nueva`, verde `cotizada`/`cerrada`, `muted` `descartada`) | `status` |
| Código mono | `public_code` |
| Fechas | `created_at` / `status_changed_at` |
| Chip de contracción | `shrinkage_pct` (o "provisorio" si `estimate_provisional`) |
| Tolerancia y máquina | derivadas de `process_id` vía catálogo, no se persisten |
| Aviso de caso especial | `special_reasons` |

**Máquina de estados** (en ADR-0005): `nueva → en_revision → cotizada → cerrada`, `descartada`
desde cualquier estado no final, y reapertura `descartada → en_revision` y
`cerrada → cotizada`. Los estados finales piden confirmación en la UI.

## Criterios de aceptación por flujo

### Envío de solicitud (cliente)

- [ ] El paso 01 muestra 7075-T6, 6061-T6 y 2024-T351 con su nota técnica, desde `catalog.ts`.
- [ ] La tabla de contracción de la landing y el wizard leen el mismo `POLYMERS` (mismos ids y
      factores).
- [ ] El resumen muestra contracción y tiempo calculados por `calcularEstimacion`. Con reparación
      sin aleación, o con EVA, el valor aparece marcado "provisorio".
- [ ] "Enviar" se habilita solo con: proceso, polímero, tallas enteras dentro de 15–50 con
      `fin ≥ inicio`, nombre, email o teléfono válido y privacidad aceptada.
- [ ] `POST /api/quotes` responde 201 con `public_code` (ej. `REQ-7075-MC08-000123`), y la
      confirmación muestra los valores devueltos por el servidor.
- [ ] La fila guardada tiene `shrinkage_pct` y `machining_hours_est` idénticos a los de la
      confirmación.
- [ ] Una reparación sin aleación genera `REQ-VRF-RB…` y `alloy_id = NULL`.
- [ ] Estos payloads responden 400 con `error.fields`: `size_end < size_start`, talla 36.5, id
      fuera de catálogo, sin contacto, sin privacidad, sin `Idempotency-Key`.
- [ ] Un payload con `shrinkage_pct` o `pairs` manipulados se guarda con los valores recalculados.
- [ ] `pairs > 30` se guarda con `is_special_case = true` y `special_reasons` contiene
      `pairs_gt_30`.
- [ ] Reenviar la misma clave con el mismo payload devuelve 200 con el mismo `public_code` y no
      crea fila.
- [ ] Reenviar la misma clave con un payload distinto devuelve 409 `IDEMPOTENCY_KEY_REUSED`, y la
      UI ofrece enviarlo como nueva solicitud.
- [ ] 10 requests concurrentes con la misma clave crean exactamente una fila.
- [ ] Doble clic en "Enviar" produce una sola request.
- [ ] Con la API caída, la UI muestra un error recuperable. Tras recargar, el borrador sigue
      cargado y "Reintentar" funciona cuando la API vuelve.
- [ ] Tras un envío exitoso, recargar sigue mostrando el último `public_code`.
- [ ] 20 requests concurrentes con claves distintas desde una misma IP producen como máximo 5
      filas; el resto recibe 429 con `Retry-After`.
- [ ] Un envío con el honeypot lleno se guarda con `is_spam = true` y no aparece en el listado
      por defecto.

### Panel admin

- [ ] `GET /admin` sin cookie válida responde **302** a `/admin/login` (test HTTP, no solo de
      navegador).
- [ ] Toda ruta `/api/admin/*` sin cookie, con firma alterada, expirada o con `iat` anterior a
      `SESSION_NOT_BEFORE` responde 401.
- [ ] Login válido responde 204 con cookie `__Host-lacers_admin` `HttpOnly; Secure;
      SameSite=Strict`. Login inválido responde 401 con un mensaje genérico idéntico para email
      inexistente y password incorrecto.
- [ ] El 6.º intento de login fallido en 15 min (por IP o por email) responde 429.
- [ ] PATCH o logout con un `Origin` ajeno responde 403.
- [ ] El listado ordena por `created_at desc`, filtra por estado, busca por `public_code` o
      folio, y muestra "Sin solicitudes registradas" cuando está vacío.
- [ ] El cambio de estado se hace desde el listado en ≤ 2 clics y persiste tras recargar.
- [ ] Una transición no permitida responde 409, y la UI no cambia el badge. PATCH al estado
      actual responde 200. Un id inexistente responde 404.
- [ ] Con la sesión expirada, el cambio de estado no se aplica y se redirige a login.
- [ ] Una solicitud enviada aparece en el listado en < 5 s (con la base ya "despierta").
- [ ] El bundle de la landing no incluye el código de `src/pages/admin/*` (chunk separado).

### Datos personales y operación

- [ ] El cron de retención:
  - pone en NULL el `ip_hash` de las filas con más de 24 h;
  - purga `rate_limits` vencidos;
  - anonimiza `contact_*` y `note` a los 12 meses de `cerrada` o `descartada`.
- [ ] `GET /api/cron/retention` sin `CRON_SECRET` responde 401.
- [ ] Los logs de servidor no contienen email, teléfono ni nombre.
- [ ] `GET /api/health` responde 200 con la base disponible y 503 si no lo está; el monitor
      externo está configurado.

### Build y despliegue

- [ ] `npm run build` (incluido `tsc -p tsconfig.api.json`) pasa; un import relativo sin `.js`
      en `server/` hace fallar el build.
- [ ] Ningún archivo de `dist/` contiene `DATABASE_URL`, `SESSION_SECRET` ni la URL de Neon, y
      no existe ninguna variable `VITE_` con secretos.
- [ ] En un preview de Vercel, `POST /api/quotes` persiste en la rama `dev`. Una ruta
      `/api/inexistente` responde 404, no `index.html`.
- [ ] Las migraciones se aplicaron a `main` antes de promover a producción (checklist de release).

## Desarrollo local y testing

- **Local:** `vercel dev` sirve la SPA (Vite) y `api/` juntos, con variables de entorno de
  Development (rama `dev`). `npm run dev` sigue sirviendo solo el frontend. Hay que documentarlo
  en `CLAUDE.md`.
- **Unitarios (Vitest):**
  - `calcularEstimacion` con un test de tabla proceso × aleación × polímero (criterio del PRD);
  - esquemas Zod;
  - `project_code` / `public_code`;
  - `payload_hash` canónico;
  - firma y verificación de la cookie;
  - máquina de estados.
- **Handlers:** se invocan directamente (`POST(new Request(…))`) contra la rama `dev`, con
  limpieza por prefijo de datos de test: idempotencia, rate limit concurrente, 401/403/409.
- **E2E (Playwright, skill `playwright-e2e-test`) contra un preview:**
  - wizard completo hasta `public_code`;
  - reintento tras una falla simulada;
  - login → cambio de estado → recarga;
  - 302 de `/admin` sin sesión.

## Plan de arranque sugerido

1. **Spike de plataforma.** Antes de construir lo demás, una Function mínima que importe
   `src/lib/cotizador` y un `middleware.ts` que verifique una cookie con Web Crypto, ambos
   desplegados en un preview. Verifica:
   - que se resuelven los imports ESM;
   - el runtime del middleware;
   - el límite de Functions de Hobby;
   - que el rewrite no captura `/api`;
   - la disponibilidad de crons en Hobby.
2. Unificación del catálogo en `catalog.ts`: polímeros, `6061-t6` e ids definitivos.
3. Esquema Drizzle y migración inicial en `dev`.
4. Recién después, los ítems del backlog (`generar-backlog`).

## Riesgos técnicos abiertos

- **Uso comercial en Hobby (ADR-0001).** Para operar con clientes reales hay que pasar a Pro u
  otro hosting. El disparador es el primer cliente real o el dominio comercial.
- **Coeficientes de mecanizado sin definir (PRD).** Hasta tenerlos, todo tiempo sale
  "provisorio". Sin ellos no se puede validar el criterio "valores coinciden" con datos reales.
- **Decisiones de producto pendientes (REVISAR):**
  - semántica de `cerrada` frente a `descartada` y sus transiciones;
  - temple de 6061;
  - tratamiento de EVA (expansión);
  - plazo de retención (12 meses);
  - plazo de respuesta prometido en el copy ("< 12 horas" frente a "24 horas hábiles");
  - umbrales de rate limit y de caso especial.
- **Datos de plataforma a confirmar en la spike:**
  - límite de Functions por deploy en Hobby;
  - runtime y APIs del Routing Middleware en proyectos Vite;
  - cupo de crons;
  - retención de logs;
  - comportamiento de `ipAddress()`.
- **Ramas Neon compartidas.** Todos los previews usan `dev`. Dos ramas de código con migraciones
  incompatibles se pisan.
- **Encuadre legal de datos personales (Ley 25.326, inscripción ante la AAIP).** Fuera del diseño
  técnico; lo decide el negocio.
- **Higiene documental.** El PRD enlaza `../../adrs/0008-autenticacion-admin.md` y `CLAUDE.md`
  apunta a `TECH-DESIGN.md`/`adrs/` de la raíz. Hay que actualizar ambos para que apunten a
  `docs/03-arquitectura/` y archivar los documentos viejos.
