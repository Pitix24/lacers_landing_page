# Backlog: LACERS CNC — Cotizador Técnico con persistencia y Panel Admin

**Fuentes:** [PRD](../01-producto/PRD.md) · [TECH-DESIGN](../03-arquitectura/TECH-DESIGN.md) ·
[ADRs 0001–0013](../03-arquitectura/adrs/) · Generado: 2026-10-26 (skill `generar-backlog`,
sesión no interactiva: el orden y los cortes siguen lo que pidió el usuario y quedan pendientes de
validación).

Este backlog **reemplaza** al `BACKLOG.md` de la raíz, que respondía al alcance anterior (panel de
precios, `pricing_formula`, mailto).

| # | Item | Alcance | Depende de | Contexto extra requerido |
|---|---|---|---|---|
| 1 | Persistencia PostgreSQL (Neon) + esquema de cotizaciones CNC | Spike de plataforma; `catalog.ts` unificado (incluye `6061-t6` y `POLYMERS`); esquema Drizzle `quotes` / `admin_users` / `rate_limits` + enum `quote_status`; migración inicial en la rama `dev`; cliente `server/db.ts` | — | Confirmar el temple de 6061 y el tratamiento de EVA (expansivo) antes de fijar los ids |
| 2 | API REST `/api/cotizaciones` (+ `/api/catalogo`) con validación server-side | `src/lib/cotizador/` (Zod, `calcularEstimacion`, `public_code`, `payload_hash`); `POST` de cotizaciones idempotente con rate limit y honeypot; `GET /api/health`; cron de retención | #1 | **Sí:** coeficientes de tiempo de mecanizado (horas base por proceso, factor por aleación, horas por par) |
| 3 | Wizard `/cotizador-tecnico` conectado a la API real + confirmación con código de seguimiento | Paso de contacto + privacidad; borrador en `localStorage`; envío con `Idempotency-Key`; manejo de 400/409/429/503; confirmación con el `public_code` y los valores que devuelve el servidor | #2 | — |
| 4 | Panel `/admin` con autenticación para gestionar cotizaciones | Login con scrypt + cookie firmada; `middleware.ts`; `/api/admin/*` (session, login, logout, quotes list/detail/PATCH); UI lazy con listado, filtro, búsqueda, detalle y cambio de estado | #1, #2 (librería `server/`: sesión, rate limit) | Confirmar la semántica de `cerrada` y `descartada` y sus transiciones (ADR-0005, `REVISAR`) |

## Detalle por spec

### Spec 1 — Persistencia PostgreSQL (Neon) + esquema de cotizaciones CNC

- **Trazabilidad:** PRD §Alcance 1 y 2 · TDD "Plan de arranque" pasos 1–3 · ADR-0002, 0003,
  0004, 0005.
- **Incluye:**
  - Spike de plataforma en un preview. Valida imports ESM de `src/lib` desde `api/`, el runtime
    del Routing Middleware con Web Crypto, el límite de Functions y de crons en Hobby, y que el
    rewrite no capture `/api`.
  - `src/data/catalog.ts`: aleaciones (7075-T6, `6061-t6`, 2024-T351), procesos, `POLYMERS`
    unificado (`caucho`/`rubber` → un solo id) y coeficientes. `landingData.ts` lo re-exporta.
    Para la aleación nueva, usar la skill `agregar-aleacion-cnc`.
  - Esquema Drizzle completo según ADR-0005: CHECKs de `pairs` y de contacto, índices, enum.
  - `drizzle-kit` con migraciones en `drizzle/`, aplicadas a `dev` con `DATABASE_URL_UNPOOLED`.
  - `server/db.ts` (`neon-http`), `tsconfig.api.json` y el build extendido.
  - `vercel.json` con `regions` y rewrite que excluye `/api`.
  - Variables de entorno solo de servidor.
- **No incluye:** endpoints de negocio, UI.
- **Listo cuando:** la migración corre en `dev`; `npm run build`, incluido
  `tsc -p tsconfig.api.json`, pasa; `dist/` no contiene secretos.

### Spec 2 — API REST de cotizaciones y catálogo con validación server-side

- **Trazabilidad:** PRD §Alcance 2, casos borde (tallas inválidas, red, spam, valores extremos) ·
  ADR-0006, 0007, 0009, 0010, 0011 (servidor), 0013.
- **Incluye:**
  - `src/lib/cotizador/`: `schema.ts`, `api.ts` (Zod de request y response), `calc.ts`
    (`calcularEstimacion`, `round`, `calc_version`), generación de `project_code`/`public_code`
    con token `VRF` y `payload_hash` canónico.
  - `POST` de cotizaciones con el flujo de 7 pasos del TDD: `Idempotency-Key`, replay 200,
    409 `IDEMPOTENCY_KEY_REUSED`, rate limit atómico 5/10 min por IP, honeypot → `is_spam`,
    `INSERT … ON CONFLICT`, 201 con `calcVersionChanged`.
  - `server/`: rate limit, hash de IP, logging JSON sin PII, error 503 `DB_UNAVAILABLE`,
    límite de 16 kB y 405.
  - `GET /api/health` y `GET /api/cron/retention` con `CRON_SECRET` + `crons` en `vercel.json`.
  - Tests Vitest: tabla proceso × aleación × polímero, Zod, códigos, hash, y handlers contra
    `dev` (concurrencia de idempotencia y de rate limit).
- **No incluye:** endpoints `/api/admin/*` (Spec 4) ni cambios en el wizard (Spec 3).
- **Listo cuando:** se cumplen los criterios del TDD §"Envío de solicitud" del lado servidor y
  §"Datos personales y operación".

### Spec 3 — Wizard conectado a la API real + confirmación con código de seguimiento

- **Trazabilidad:** PRD §Alcance 2 y casos borde (doble clic, abandono, falla de red) ·
  ADR-0007 (cliente), 0009 (ciclo de la clave), 0011 (cliente), 0013 (aviso).
- **Incluye:**
  - Paso de contacto: nombre, empresa, email o teléfono, checkbox de privacidad.
  - Honeypot.
  - Borrador `lacers.cotizador.draft.v1` rehidratado con Zod.
  - Resumen con `calcularEstimacion` y el marcador "provisorio".
  - `submission_key` generada al tocar "Enviar" y reutilizada mientras el payload no cambie.
  - Timeout de 20 s, "Reintentar", errores por campo (400), diálogo de reuso de clave (409),
    429 con link a WhatsApp.
  - Confirmación con el `public_code` y los valores del servidor, persistida en
    `lacers.cotizador.last.v1`.
  - WhatsApp como canal complementario.
  - UI con tokens de DESIGN.md.
- **Listo cuando:** pasa el e2e de Playwright "wizard completo → `public_code`" y "reintento tras
  falla" contra un preview.

### Spec 4 — Panel `/admin` con autenticación para gestionar cotizaciones

- **Trazabilidad:** PRD §Alcance 3, casos borde (sesión expirada, listado vacío) · ADR-0005
  (máquina de estados), 0006, 0008, 0010 (login), 0011 (admin), 0012.
- **Incluye:**
  - `server/session.ts` con Web Crypto: firma y verificación, `requireAdmin`, `Origin` / CSRF,
    `SESSION_NOT_BEFORE`.
  - scrypt con relleno anti-enumeración; `npm run admin:create`.
  - Endpoints `login`, `logout`, `session`, `quotes` (listado paginado con `status`, `q`,
    `cursor` y `spam`), `quotes/[id]` (GET y PATCH con máquina de estados: 404/409/200
    idempotente).
  - `middleware.ts` con 302 a `/admin/login?next=`.
  - `src/pages/admin/*` con `React.lazy`: login, listado con badge de estado, estado vacío,
    cambio de estado en ≤ 2 clics con confirmación en estados finales, detalle completo.
- **Tamaño:** es el ítem más grande. Si el ciclo SDD se hace largo, partir en **4a
  Autenticación** (sesión, login/logout/session, middleware, `admin:create`) y **4b Gestión de
  cotizaciones** (endpoints de quotes + UI).
- **Listo cuando:** se cumplen los criterios del TDD §"Panel admin", incluido el test HTTP del
  302 y el chunk separado.

## Divergencias entre el pedido y el TDD/ADRs (resolver antes de la spec)

| # | Pedido | Qué fija el TDD/ADR | Recomendación |
|---|---|---|---|
| D1 ✅ | "Prisma Schema" (Spec 1) — **resuelto: Prisma, ADR-0014** | **Drizzle** sobre `@neondatabase/serverless` (ADR-0004, *Aceptado*) | Mantener Drizzle. Si se quiere Prisma, primero escribir un ADR que reemplace al 0004, porque cambia el cliente, las migraciones y el modelo de transacciones de ADR-0009/0010 |
| D2 ✅ | `/api/cotizaciones` — **resuelto: `/api/quotes`** | `/api/quotes` (ADR-0006) | Elegir un solo nombre. En las specs se usa el del ADR hasta que se decida; renombrar tiene costo cero ahora |
| D3 | `/api/catalogo` | No existe. El catálogo vive en código y se comparte por import (ADR-0007, PRD "No alcance": sin edición de catálogo) | No crearlo: sería la 9.ª Function en Hobby y duplicaría una fuente que ya llega en el bundle. Si se quiere, enmendar ADR-0006 y limitarlo a `GET` de solo lectura sobre `catalog.ts` |

## Cómo usar este backlog

Cada ítem es una spec independiente. Al implementarlo, arrancá un ciclo de Spec-Driven
Development usando ese ítem como el "change", no el proyecto completo. En este repo, el
flujo es OpenSpec:

- `/opsx:propose` sobre el change que ya está creado en `openspec/changes/`;
- `/opsx:apply` para implementarlo;
- `/opsx:archive` al terminar.

Si la columna "Contexto extra requerido" tiene algo, compartilo como contexto al generar la
spec de ese ítem.

**Nota sobre el ítem 2:** antes de generar la spec, compartí tu documentación de reglas de
negocio de este dominio como contexto, si la tenés. Son los coeficientes de tiempo de mecanizado
por proceso, aleación y par. Sin ellos, todo tiempo sale "provisorio" y no se puede validar el
criterio del PRD "los valores coinciden con los guardados en DB" con datos reales.
