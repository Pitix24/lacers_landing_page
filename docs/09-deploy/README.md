# Deploy Plan — LACERS CNC

Fecha: 2026-10-26
Estado: EJECUTADO — pipeline completo en verde y producción verificada el 2026-10-27 (ver
[Registro de ejecución](#registro-de-ejecución-y-verificación))

Objetivo de esta pasada: que **el único camino a producción** sea un pipeline de GitHub Actions
con gates reales — build + esquema, E2E de Playwright — y que cada release quede verificado con
un smoke test de solo lectura sobre la URL pública.

Artefactos de esta pasada:

- [`.github/workflows/ci-cd.yml`](../../.github/workflows/ci-cd.yml) — pipeline de 4 pasos.
- [`vercel.json`](../../vercel.json) — `git.deploymentEnabled: false` (cierra el deploy por push).

## Resumen del proyecto

- **SPA Vite 5 + React 18 + TypeScript** con React Router 7 (`/`, `/cotizador-tecnico`, `/admin`)
  y **Vercel Functions** en `api/` (`GET /api/health`, `POST /api/quotes`, `GET /api/admin/quotes`)
  con lógica de servidor en `server/`. Un solo repo, un solo proyecto Vercel
  (`.vercel/project.json` → `proyect-landing-page`), ADR-0001 / ADR-0003.
- **Datos:** PostgreSQL en Neon vía Prisma 7 + `@prisma/adapter-neon` (ADR-0014), ramas `dev` y
  `production` (ADR-0002). Migraciones en `prisma/migrations/` (`init`, `rate_limits`).
- **Build:** `npm run build` = `prisma generate` → `tsc --noEmit` (SPA) → `tsc -p tsconfig.api.json`
  (API) → `vite build` (→ `dist/`). npm con `package-lock.json`.
- **Tests:** 3 specs Playwright en `tests/` (solo Chromium). Corren contra `npm run dev` con
  `DATABASE_URL=''` → la API usa **almacenamiento en memoria**; `tests/global-setup.ts` aborta si
  `/api/health` no responde `storage: "memory"`. **Los E2E nunca tocan Neon.**
- **CI/CD previo:** no existía (`.github/` ausente; lo confirma `SECURITY-REPORT.md`). El proyecto
  Vercel está linkeado; hoy un push a `main` desplegaría sin pasar por ningún test.

## Sistema de deployment propuesto

### Build
`npm ci` (determinista por lockfile; `postinstall` corre `prisma generate`) → `npx prisma validate`
→ `npm run build`. El build no se conecta a la base: se le pasa un `DATABASE_URL` placeholder
solo para que el CLI de Prisma resuelva la config.

### Artifact
El deployment de Vercel construido desde el commit de `main` que pasó los gates. Es trazable por
SHA: el job `deploy` escribe el commit en el resumen del run y el job `smoke` espera el estado
`Vercel` **de ese mismo commit** antes de verificar.

### Config & Secrets

| Dato | Tipo | Dónde vive |
|---|---|---|
| `VERCEL_DEPLOY_HOOK_URL` | secret | GitHub → Environment `production` (opción A, recomendada) |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | secret / id | GitHub → Environment `production` (opción B, fallback por CLI) |
| `PRODUCTION_URL` | config (variable, no secret) | GitHub → Environment `production` |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (rama `production`) | secret | **Solo en Vercel** (Production). CI nunca la ve |
| `ADMIN_TOKEN` (≥ 24 caracteres), `IP_HASH_SALT` | secret | **Solo en Vercel** (Production) |

Reglas: ninguna URL de base ni token de admin entra a GitHub; los E2E no necesitan secrets
(modo memoria); ningún valor se imprime en logs (`curl -fsS` sin `-v`).

### Infraestructura
Sin cambios: Vercel (free tier, ADR-0001) + Neon (ADR-0002). GitHub Actions como orquestador. No
se introduce infraestructura nueva.

### Entornos
- **Local / CI (E2E):** `npm run dev` con API en memoria. Sin base.
- **Desarrollo de datos:** rama Neon `dev` (`npm run db:migrate` / `db:seed`, manual).
- **Producción:** Vercel Production + rama Neon `production`.
- Sin staging: MVP de un solo dueño. Entre entornos cambia config/secrets, no código.

### Estrategia de release
**Release directo y automático** desde `main` cuando pasan los gates. Sin canary ni blue/green:
tráfico bajo y Vercel permite volver al deployment anterior al instante (ver Recovery).

### Data & Migrations
`prisma migrate deploy` contra la rama `production` **queda fuera del pipeline**: es un paso
manual, con autorización explícita, **antes** de mergear un cambio de esquema. El pipeline solo
valida el esquema (`prisma validate`) y que el cliente generado compile con la API (`tsc`).
Un rollback de código **no** revierte datos: las migraciones tienen que ser compatibles hacia
atrás (expand → contract) para que la versión anterior siga funcionando.

### Deploy gates
Workflow [`.github/workflows/ci-cd.yml`](../../.github/workflows/ci-cd.yml):

| Paso | Job | Cuándo | Qué hace |
|---|---|---|---|
| 1 | `quality` — Build & Schema check | PR, push a `main`, manual | `npm ci` → `prisma validate` → `npm run build` (Prisma generate + tipos SPA y API + Vite) |
| 2 | `e2e` — Gate E2E | después de `quality` | `npx playwright install --with-deps chromium` → `npx playwright test` (API en memoria); sube reporte y traces si falla |
| 3 | `deploy` — Producción | solo push a `main`, `needs: [quality, e2e]` | Deploy Hook (`VERCEL_DEPLOY_HOOK_URL`) o, si no está, `vercel deploy --prod` con token |
| 4 | `smoke` — post-deploy | después de `deploy` | Espera el deployment del commit y hace GETs de solo lectura que exigen HTTP 200 |

**Gate real, no solo un check:** con la integración Git de Vercel activa, un push a `main`
desplegaría aunque Playwright falle. Por eso `vercel.json` lleva
`"git": { "deploymentEnabled": false }` y **el único camino a producción es el job `deploy`**.
Los deploys por Deploy Hook y por CLI no se ven afectados por ese flag.

**Seguridad:** trigger `pull_request` (nunca `pull_request_target`), `permissions: contents: read`
por defecto, secrets solo en el Environment `production`, al que solo llega un push a `main`.

### Verify & Observe
Smoke post-deploy (job `smoke`), todos de **solo lectura** (no crea cotizaciones reales):

| Chequeo | Esperado |
|---|---|
| `GET /` | 200 |
| `GET /cotizador-tecnico` | 200 (rewrite SPA de `vercel.json`) |
| `GET /admin` | 200 (shell de la SPA; los datos van por API) |
| `GET /api/health` | 200 con `"storage":"database"` (la Function llega a Neon con `SELECT 1`) |
| `GET /api/admin/quotes` sin token | 401 (la PII no queda expuesta) |

Un smoke rojo marca el release como **fallido** en el run. Observación posterior: logs de
Functions en Vercel (eventos JSON sin PII de `logEvent`) y métricas de Neon, revisión manual.

### Recovery
- **Código:** "Promote" / `vercel rollback` al deployment anterior (instantáneo). Lo ejecuta el
  dueño, nunca el pipeline.
- **Datos:** restore de la rama `production` de Neon a un punto en el tiempo — destructivo,
  siempre con autorización explícita.
- **Secrets comprometidos:** rotar `ADMIN_TOKEN`, `IP_HASH_SALT`, el Deploy Hook (borrar y crear
  uno nuevo) o el `VERCEL_TOKEN`.
- **Pipeline caído y urgencia:** `workflow_dispatch` no despliega (solo corre gates); un deploy
  manual de emergencia por CLI requiere autorización del dueño y se registra abajo.

## Decisiones tomadas

1. Mismo modelo que el proyecto de referencia `Marioyahuar/mimo_demo`: quality → e2e → deploy por
   hook → smoke, con el deploy por Git desactivado.
2. **E2E en modo memoria**, sin secrets ni rama Neon dedicada: lo garantiza `global-setup.ts`.
   (Diferencia con la referencia, que usa una rama Neon e2e.)
3. Deploy Hook como opción principal; Vercel CLI con token como alternativa en el mismo job.
4. Migraciones de Prisma fuera del pipeline (manuales).
5. Node 22 en CI (`@types/node` 22).

## Fuera de alcance de esta pasada
Staging / Preview gated, branch protection, migraciones automáticas, monitoreo/alertas,
hallazgos abiertos de [`SECURITY-REPORT.md`](../08-seguridad/SECURITY-REPORT.md).

## Autorizaciones

Ejecutadas por el dueño el 2026-10-27:

- [x] Crear el Environment `production` en GitHub (`Pitix24/lacers_landing_page`).
- [x] Crear un Deploy Hook en Vercel (Settings → Git → Deploy Hooks, rama `main`) y guardarlo
      **solo** como secret `VERCEL_DEPLOY_HOOK_URL` en `production`.
- [x] Cargar la variable `PRODUCTION_URL` (URL pública del proyecto) en `production`.
- [x] Variables en Vercel Production: `DATABASE_URL` / `DATABASE_URL_UNPOOLED` (integración de
      Neon) y `ADMIN_TOKEN`.
- [x] Aplicar `npm run db:migrate` y `npm run db:seed` contra la base de producción.
- [x] Commit + push a `main` de `ci-cd.yml` y `vercel.json` (dispara el primer run real).

## Registro de ejecución y verificación

- 2026-10-26 — DISCOVER + DESIGN + GENERATE: plan, `ci-cd.yml` y `vercel.json`
  (`git.deploymentEnabled: false`). Nada ejecutado contra Vercel, Neon ni GitHub.
- 2026-10-27 — EXECUTE: Environment `production` con Deploy Hook y `PRODUCTION_URL`; Neon
  conectado por la integración de Vercel; migraciones `init` y `rate_limits` y seed (7 materiales)
  aplicados. Run `40455019854` en verde en los 4 jobs.
- 2026-10-27 — VERIFY manual: landing, wizard, errores de la API (400/405/413/401) y `/admin`
  protegido. Una cotización de prueba real (`REQ-7075-TX08-000001`) se registró en Neon; un
  segundo clic en "Enviar" creó `-000002` porque el wizard descartaba la `Idempotency-Key`.
  Corregido en `fix(cotizador): reutiliza la Idempotency-Key al reenviar`. Pendiente: cabeceras de
  seguridad (SEC-02).
