# ADR 0003: Componentes — monorepo con SPA + Vercel Functions

## Estado

Aceptado (heredado). Ajustes de compilación agregados tras revisión adversarial.

## Contexto

El repo ya es una SPA Vite + React 18 + TS + Tailwind + React Router 7, y `CLAUDE.md` fija como
backend previsto "Vercel Functions en `api/`". El ADR-0003 previo (raíz `adrs/`) ya había
elegido monorepo único. Se documenta tal cual, más las reglas que hacen falta para que el
código compartido funcione dentro de una Function.

`package.json` tiene `"type": "module"`, y el `tsconfig.json` actual usa
`moduleResolution: "bundler"`, `lib: DOM` e `include: ["src", …]`: no chequea `api/` ni
`server/`, y acepta imports sin extensión que Node ESM rechaza en runtime.

## Decisión

Un solo repo y un solo deploy:

- `src/` — SPA (landing, `/cotizador-tecnico`, y rutas `/admin/*` cargadas con `React.lazy`).
- `src/lib/cotizador/` — módulo **puro** (sin React ni DOM): esquemas Zod, cálculo,
  `project_code`, tipos de API. Lo importan el frontend y la API.
- `src/data/catalog.ts` — catálogo y reglas de cálculo (aleaciones, procesos, polímeros,
  coeficientes), **re-exportado** desde `landingData.ts` para respetar la convención de
  `CLAUDE.md` sin arrastrar todo el contenido de la landing a las Functions.
- `api/` — Vercel Functions (un archivo por recurso).
- `server/` — código solo de servidor (cliente DB, sesión, hashing, rate limit, logging).
- `middleware.ts` (raíz) — Routing Middleware que protege `/admin/*` (ADR-0012).
- `drizzle/` — migraciones SQL versionadas.

**Reglas de módulos** (para `src/lib/cotizador/`, `src/data/catalog.ts`, `src/types/`,
`server/`, `api/`, `middleware.ts`):

1. Solo imports relativos **con extensión `.js`** (`../server/db.js`). Prohibido el alias `@/`
   en estas carpetas (Vite lo resuelve, `@vercel/node` no).
2. Nuevo `tsconfig.api.json` (`module`/`moduleResolution: NodeNext`, `types: ["node"]`, sin
   DOM) que incluye esas carpetas. `npm run build` pasa a ser
   `tsc --noEmit && tsc -p tsconfig.api.json --noEmit && vite build`, así un import sin
   extensión falla al compilar y no en producción.
3. Ningún secreto con prefijo `VITE_` (Vite solo expone `import.meta.env.VITE_*` al bundle).

**Primer entregable del backlog:** una *spike* — Function mínima que importe `src/lib/cotizador`
y responda en un preview de Vercel — antes de construir el resto.

## Consecuencias

- Un deploy, tipos y cálculo compartidos sin publicar paquetes.
- Los archivos compartidos con la API se escriben con un estilo distinto al resto del frontend
  (imports relativos con `.js`); es fricción y hay que recordarlo en `CLAUDE.md`.
- `npm run build` hace dos pasadas de `tsc`: unos segundos más.
- `vercel.json` debe dejar de reescribir `/api/*` a `index.html`.

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (C1, C5, S2): reglas de imports ESM, `tsconfig.api.json`,
  `catalog.ts` separado, spike de plataforma, `React.lazy` del admin, regla de `VITE_`.
