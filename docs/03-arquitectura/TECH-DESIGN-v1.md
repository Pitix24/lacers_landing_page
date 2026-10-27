# Technical Design Document: LACERS CNC — Cotizador Técnico con persistencia y Panel Admin

> **Versión 1 (pre-revisión adversarial).** Los ADRs enlazados se corrigieron después (ver su sección "Historial") y se agregaron ADR-0012 y ADR-0013. La versión vigente es
> [TECH-DESIGN.md](TECH-DESIGN.md). Este archivo se conserva como registro.

**Tipo de proyecto:** Brownfield — repo revisado: este mismo (`src/`, `vercel.json`,
`package.json`, `CLAUDE.md`) y el diseño previo (`TECH-DESIGN.md` y `adrs/` de la raíz, que este
documento reemplaza).
**Design.md disponible:** Sí — [docs/02-diseno/DESIGN.md](../02-diseno/DESIGN.md).
**PRD:** [docs/01-producto/PRD.md](../01-producto/PRD.md).

**Modo de generación:** sesión no interactiva. Las decisiones marcadas *mandato* las fijó el
usuario/curso; las *heredadas* ya estaban en el repo o en `CLAUDE.md`; las *propuestas* las tomó
el agente y requieren confirmación (marcadas `REVISAR`).

## Resumen

Se extiende la landing existente de LACERS (SPA Vite + React) para que el wizard de
`/cotizador-tecnico` deje de terminar en un mensaje de WhatsApp y pase a **registrar cada
solicitud en PostgreSQL (Neon)** con un cálculo preliminar (contracción por polímero y tiempo
de mecanizado) recalculado en servidor, y se agrega un panel `/admin` protegido donde el
ingeniero lista, consulta y cambia el estado de las solicitudes. Todo se despliega en Vercel
free tier con Vercel Functions en `api/`. El catálogo (aleaciones, procesos, polímeros, reglas
de cálculo) sigue en código (PRD, "No alcance").

## Arquitectura de componentes

| Componente | Estado | Responsabilidad |
|---|---|---|
| SPA `src/` (landing + `/cotizador-tecnico`) | Existe, se modifica | Wizard con borrador en `localStorage`, paso de contacto, envío a la API |
| SPA `src/pages/admin/*` | Nuevo | Login, listado con filtro por estado, detalle, cambio de estado |
| `src/lib/cotizador/` | Nuevo | Esquemas Zod, `calcularEstimacion`, generación de `project_code`, tipos de API — puro, compartido |
| `src/data/landingData.ts` | Existe, se amplía | Catálogo + reglas de cálculo (polímeros, coeficientes) |
| `api/` | Nuevo | 7 Vercel Functions REST ([ADR-0006](adrs/0006-api-rest.md)) |
| `server/` | Nuevo | Cliente Drizzle, sesión firmada, scrypt, rate limit, logging |
| Neon PostgreSQL | Nuevo | `quotes`, `admin_users` |

```
Browser (SPA)
  ├─ /cotizador-tecnico ── POST /api/quotes (Idempotency-Key) ──┐
  └─ /admin/*  ─────────── /api/admin/* (cookie lacers_admin) ──┤
                                                                ▼
                                    Vercel Functions (api/ + server/)
                                       │ Zod + calcularEstimacion (src/lib/cotizador)
                                       │ Drizzle (neon-http)
                                       ▼
                                    Neon PostgreSQL
```

`vercel.json`: el rewrite SPA pasa a excluir `/api/` → `{"source": "/((?!api/).*)",
"destination": "/index.html"}`.

Variables de entorno (solo servidor): `DATABASE_URL`, `SESSION_SECRET`, `IP_HASH_SALT`.

## Decisiones de arquitectura

| # | Decisión | Estado |
|---|---|---|
| [ADR-0001](adrs/0001-despliegue-vercel-free-tier.md) | Despliegue en Vercel free tier | Aceptado (mandato) |
| [ADR-0002](adrs/0002-persistencia-neon-postgresql.md) | Persistencia en PostgreSQL (Neon) | Aceptado (mandato) |
| [ADR-0003](adrs/0003-componentes-monorepo-spa-y-functions.md) | Monorepo SPA + Vercel Functions | Aceptado (heredado) |
| [ADR-0004](adrs/0004-acceso-a-datos-drizzle-neon-serverless.md) | Drizzle sobre `@neondatabase/serverless` | Aceptado (heredado) |
| [ADR-0005](adrs/0005-modelo-de-datos-cotizaciones.md) | Modelo de datos: `quotes` + `admin_users`, catálogo en código | Propuesto |
| [ADR-0006](adrs/0006-api-rest.md) | API REST | Aceptado (mandato) |
| [ADR-0007](adrs/0007-validacion-server-side-y-calculo-compartido.md) | Validación server-side + cálculo compartido | Aceptado (mandato) |
| [ADR-0008](adrs/0008-autenticacion-admin-cookie-firmada.md) | Auth admin por cookie firmada | Aceptado (mandato) |
| [ADR-0009](adrs/0009-idempotencia-en-cotizaciones.md) | Idempotencia en cotizaciones | Aceptado (mandato) |
| [ADR-0010](adrs/0010-proteccion-anti-spam-rate-limit.md) | Rate limit + honeypot | Propuesto |
| [ADR-0011](adrs/0011-estado-cliente-y-resiliencia.md) | Estado del cliente y resiliencia | Propuesto |

## Modelo de datos

Detalle en [ADR-0005](adrs/0005-modelo-de-datos-cotizaciones.md).

- **`quotes`**: `id`, `folio`, `submission_key` (UNIQUE), `project_code`, `process_id`,
  `alloy_id?`, `polymer_id`, `geometry_mode`, `size_start`, `size_end`, `pairs`, `note`,
  `contact_name`, `contact_company?`, `contact_email?`, `contact_phone?`, `shrinkage_pct`,
  `machining_hours_est`, `estimate_provisional`, `calc_version`, `is_special_case`, `status`,
  `status_changed_at`, `created_at`, `ip_hash`.
- **`admin_users`**: `id`, `email` (UNIQUE), `password_hash`, `created_at`.

Elementos de DESIGN.md con datos: badge de estado → `status`; código mono → `project_code`;
fecha → `created_at`/`status_changed_at`; chip de contracción → `shrinkage_pct`; tolerancia y
máquina → derivadas de `process_id` vía catálogo (no se persisten).

**Transiciones de estado (propuesta, REVISAR):** `nueva → en_revision → cotizada → cerrada`;
`descartada` desde cualquier estado no `cerrada`. Se valida en servidor con
`UPDATE … WHERE id = $1 AND status = ANY($permitidos)`; 0 filas → 409.

## Criterios de aceptación por flujo

### Envío de solicitud (cliente)

- [ ] El paso 01 muestra 7075-T6, 6061 y 2024-T351 con su nota técnica.
- [ ] El panel resumen muestra contracción y tiempo estimado calculados por
      `calcularEstimacion`; con reparación sin aleación, el tiempo aparece marcado "provisorio".
- [ ] "Enviar" se habilita solo con proceso, polímero, `pairs > 0`, nombre y email o teléfono
      válidos.
- [ ] Al enviar, `POST /api/quotes` responde 201 con `folio` y `project_code`; la UI los muestra.
- [ ] La fila guardada tiene `shrinkage_pct` y `machining_hours_est` idénticos a los mostrados.
- [ ] Un payload con `size_end < size_start`, id fuera de catálogo o sin contacto responde 400
      con `error.fields`.
- [ ] Un payload que incluya `shrinkage_pct` manipulado se guarda con el valor recalculado.
- [ ] `pairs > 30` se guarda con `is_special_case = true`.
- [ ] Reenviar la misma `Idempotency-Key` devuelve 200 con el mismo `folio` y no crea fila.
- [ ] Doble clic en "Enviar" produce una sola request.
- [ ] Con la API caída, la UI muestra error recuperable; tras recargar la página el borrador
      sigue cargado.
- [ ] La 6.ª solicitud desde la misma IP en 10 min responde 429.

### Panel admin

- [ ] `POST /api/admin/login` con credenciales válidas responde 204 con cookie `HttpOnly`,
      `Secure`, `SameSite=Strict`; inválidas → 401 con mensaje genérico.
- [ ] Toda ruta `/api/admin/*` sin cookie, con firma alterada o expirada responde 401 (test e2e).
- [ ] Entrar a `/admin` sin sesión redirige a `/admin/login`.
- [ ] El listado ordena por `created_at desc`, filtra por estado y muestra "Sin solicitudes
      registradas" cuando está vacío.
- [ ] El cambio de estado se hace desde el listado en ≤ 2 clics y persiste tras recargar.
- [ ] Una transición no permitida responde 409 y la UI no cambia el badge.
- [ ] Con la sesión expirada, el cambio de estado no se aplica y se redirige a login.
- [ ] Una solicitud enviada aparece en el listado en < 5 s.

### Build y despliegue

- [ ] `npm run build` pasa; ningún archivo del bundle contiene `DATABASE_URL` ni
      `SESSION_SECRET`.
- [ ] Un preview de Vercel resuelve `/api/quotes` como Function (no devuelve `index.html`).

## Riesgos técnicos abiertos

- Coeficientes de tiempo de mecanizado no definidos (PRD): bloquean valores reales.
- Factores de contracción del wizard (`POLYMERS`) no coinciden con los rangos de
  `POLYMER_SHRINKAGE_TABLE` de la landing; hay que unificar fuente.
- Retención de datos personales sin definir.
- Límites del free tier de Vercel y Neon no dimensionados contra tráfico real.
