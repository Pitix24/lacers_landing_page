# CLAUDE.md — LACERS CNC

Landing de matricería CNC en aluminio para calzado, con Cotizador Técnico y panel admin.

## Documentos de referencia (leer antes de implementar)

- **Producto:** [docs/01-producto/PRD.md](docs/01-producto/PRD.md) — alcance del MVP, no alcance,
  criterios de éxito y casos borde. Es la fuente de verdad de qué construir.
- **Diseño:** [docs/02-diseno/DESIGN.md](docs/02-diseno/DESIGN.md) — tokens, tipografía,
  componentes base y patrones de UI. Toda UI nueva (incluido `/admin`) debe usarlos.
- Arquitectura y decisiones: `TECH-DESIGN.md` y `adrs/` (pendientes de alinear con el PRD de
  `docs/01-producto/`).

## Stack

- Vite + React 18 + TypeScript + Tailwind CSS 3 + React Router 7 (SPA).
- Deploy en Vercel. Backend previsto: Vercel Functions en `api/` + PostgreSQL (Neon) vía Prisma 7 +
  `@prisma/adapter-neon` (ADR-0014). Lógica de servidor en `server/`, contrato y Zod en
  `src/lib/cotizador/`.

## Comandos

- `npm run dev` — servidor de desarrollo.
- `npm run build` — `tsc --noEmit` + `vite build` (debe pasar antes de dar algo por terminado).
- `npm run lint` — chequeo de tipos (SPA + `tsconfig.api.json`).
- `npm run db:migrate` / `db:seed` — migraciones y seed de Prisma contra la rama `dev` de Neon.

## Estructura

- `src/pages/` — vistas por ruta (`/` → `Home`, `/cotizador-tecnico` → `CotizadorTecnicoPage`).
- `src/components/` — secciones de la landing y el wizard `CotizadorTecnico.tsx`.
- `src/components/common/` — `SectionHeading`, `MaterialIcon`, `StatusPulseDot`.
- `src/data/landingData.ts` — todo el contenido y catálogo (`CNC_ALLOYS`, `CNC_PROCESSES`, …).
- `src/types/landing.ts` — tipos del contenido.
- Alias `@/` → `src/`.

## Convenciones

- Contenido y catálogo en `landingData.ts` tipado; no hardcodear textos de catálogo en componentes.
- Solo usar tokens de `tailwind.config.js` (`canvas`, `surface-card`, `metal`, `accent-red`,
  `accent-green`, `main`, `muted`); no introducir hex sueltos. `rounded-sm` por defecto.
- Copy en español rioplatense (voseo); tags técnicos con prefijo `//`.
- Para agregar aleaciones o procesos usar la skill `agregar-aleacion-cnc`.
- Subagentes: `code-reviewer` (revisión de calidad/tipado/seguridad, solo lectura) y
  `spec-implementer` (implementa una spec del backlog con Prisma + Neon dev).
- Secrets (DB, JWT) solo en variables de entorno del servidor; nunca en el bundle del frontend.
