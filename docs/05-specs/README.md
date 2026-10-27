# Specs — LACERS CNC

Índice de las specs del MVP y su estado en el ciclo de Spec-Driven Development (OpenSpec).
El detalle de alcance y la trazabilidad están en
[docs/04-backlog/BACKLOG.md](../04-backlog/BACKLOG.md).

| # | Spec | Change OpenSpec | Depende de | Estado | Avance (Clase 9) | Bloqueos / pendientes |
|---|---|---|---|---|---|---|
| 1 | Persistencia PostgreSQL (Neon) + esquema **Prisma** de cotizaciones CNC | [`spec-01-persistencia-neon`](../../openspec/changes/spec-01-persistencia-neon/) | — | En implementación | 12/18 tareas | Aplicar migración + seed en `dev` (credenciales); temple de 6061; spike en preview |
| 2 | API REST `/api/quotes` con validación server-side | [`spec-02-api-cotizaciones`](../../openspec/changes/spec-02-api-cotizaciones/) | #1 | En implementación | 13/18 tareas | Rate limit (ADR-0010), cron de retención, tests Vitest; **coeficientes de mecanizado** |
| 3 | Wizard `/cotizador-tecnico` con API real + código de seguimiento | [`spec-03-wizard-api-real`](../../openspec/changes/spec-03-wizard-api-real/) | #2 | En implementación | 8/12 tareas | Borrador en `localStorage`, 429, e2e Playwright |
| 4 | Panel `/admin` con autenticación | [`spec-04-panel-admin`](../../openspec/changes/spec-04-panel-admin/) | #1, #2 | En implementación (4b parcial) | 4/12 tareas | Auth definitiva (ADR-0008); detalle y PATCH; semántica de `cerrada` / `descartada` |

Las tareas de cada change están en su `tasks.md`. Ninguno tiene todavía `proposal.md` ni specs
delta: se implementó directo desde el backlog en la Clase 9, así que `openspec validate` sigue
fallando hasta completar el ciclo `/opsx:propose`.

### Avance de la Clase 9 (2026-10-26)

- **Persistencia:** `prisma/schema.prisma` (`QuoteRequest`, `CncMaterial`), migración inicial con
  CHECKs, `prisma.config.ts`, `prisma/seed.ts`, `server/neon.ts`, `.env.example`. Decisión en
  [ADR-0014](../03-arquitectura/adrs/0014-acceso-a-datos-prisma-neon.md) (reemplaza a ADR-0004).
- **API (Vercel Functions, firma Web):** `POST /api/quotes`, `GET /api/admin/quotes`,
  `GET /api/health`. En `npm run dev` las sirve un plugin de Vite (`vite.config.ts`).
- **Fallback:** sin `DATABASE_URL`, la API guarda en memoria solo en local/test y lo informa
  (`storage: "memory"`); en Vercel responde 503 `DB_UNAVAILABLE` y el wizard ofrece reintentar o
  WhatsApp.
- **UI:** wizard con paso de contacto y confirmación con `public_code`; `/admin` lazy con listado.
- **Subagentes:** `.claude/agents/code-reviewer.md` y `.claude/agents/spec-implementer.md`.

Estados posibles: *Change creado, sin artefactos* → *Propuesto* (proposal, specs, design y tasks
listos) → *En implementación* → *Archivado*.

## Orden de ejecución

```
#1 Persistencia ──► #2 API ──┬──► #3 Wizard
                             └──► #4 Admin
```

#3 y #4 pueden avanzar en paralelo una vez cerrada la #2: #4 reutiliza `server/`
(rate limit, logging), y su listado necesita filas reales creadas por `POST`.

## Flujo por spec

1. Resolver lo que figura en "Bloqueos / contexto" (ver las divergencias D1–D3 en el backlog).
2. `/opsx:propose spec-0N-…` genera `proposal.md`, `specs/<capability>/spec.md`, `design.md` y
   `tasks.md` dentro del change. Las reglas de `openspec/config.yaml` obligan a citar
   el backlog y los ADRs.
3. `openspec validate spec-0N-…` tiene que pasar. Hoy falla a propósito: los changes todavía no
   tienen specs delta.
4. `/opsx:apply` para implementar y `npm run build` antes de cerrar.
5. `/opsx:archive`: mueve el change a `openspec/changes/archive/`, sincroniza las specs a
   `openspec/specs/` y actualiza el estado en esta tabla.

## Estructura de `openspec/`

```
openspec/
├── config.yaml        # schema spec-driven + contexto del proyecto + reglas por artefacto
├── specs/             # specs vigentes (se llenan al archivar cada change)
└── changes/
    ├── spec-01-persistencia-neon/
    ├── spec-02-api-cotizaciones/
    ├── spec-03-wizard-api-real/
    ├── spec-04-panel-admin/
    └── archive/
```
