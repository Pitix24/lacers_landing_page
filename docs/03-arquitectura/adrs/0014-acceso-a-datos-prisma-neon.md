# ADR 0014: Acceso a datos — Prisma 7 con `@prisma/adapter-neon`

## Estado

Aceptado (pedido del usuario, Clase 9). **Reemplaza a [ADR-0004](0004-acceso-a-datos-drizzle-neon-serverless.md).**
Resuelve la divergencia D1 del backlog.

## Contexto

El backlog dejó abierta la divergencia D1: el pedido de la spec-01 dice "Prisma Schema" y el
ADR-0004 fijaba Drizzle. La Clase 9 pide explícitamente `prisma/schema.prisma` con los modelos
`QuoteRequest` y `CncMaterial`, cliente en `neon.ts` y endpoints serverless en `api/`.

## Decisión

- **Prisma 7.10** con el generador `prisma-client` (ESM, imports `.js`) en
  `server/generated/prisma` (no versionado; lo genera `postinstall` y `npm run build`).
- **Driver adapter `@prisma/adapter-neon`** (`PrismaNeon`, WebSocket sobre
  `@neondatabase/serverless`): sin binarios de query engine y con soporte de transacciones
  interactivas. `server/neon.ts` expone un `PrismaClient` único por instancia (Fluid Compute).
- **URLs**: `DATABASE_URL` (pooled) para la app; `DATABASE_URL_UNPOOLED` (directa) para
  `prisma migrate`, configurada en `prisma.config.ts`. Solo servidor, nunca `VITE_`.
- **Migraciones** SQL versionadas en `prisma/migrations/`; los CHECK que Prisma no expresa
  (tallas 15–50, `pairs` calculado, email o teléfono) se agregan a mano en el `migration.sql`.
  Mismo orden que ADR-0004: `dev` → preview → `main`, *expand/contract*.
- **`public_code`**: `INSERT` + `UPDATE` dentro de `$transaction` (el folio lo asigna
  Postgres). Reemplaza el `INSERT … ON CONFLICT` de ADR-0009; la carrera de la misma
  `submission_key` se resuelve con el `UNIQUE` (`P2002`) y se responde como replay.
- **`CncMaterial`** es un espejo de solo lectura del catálogo en código (`npm run db:seed`), sin
  FK desde `QuoteRequest`: la fuente de verdad sigue siendo `landingData.ts` (ADR-0005).
- **Fallback**: sin `DATABASE_URL`, `server/quotes-repo.ts` usa memoria **solo fuera de
  producción** (`npm run dev`, tests). En Vercel responde 503 `DB_UNAVAILABLE`.

## Alternativas consideradas

- **Mantener Drizzle (ADR-0004)** — bundle más chico y SQL explícito, pero contradice el pedido
  de la clase.
- **Prisma con `PrismaNeonHttp`** — sin WebSocket, pero sin transacciones interactivas; el
  `public_code` necesitaría una columna generada que Prisma no modela.
- **Prisma Accelerate / Postgres gestionado por Prisma** — suma un servicio externo sin
  necesidad con el tráfico del MVP.

## Consecuencias

- Queries tipadas y migraciones con `prisma migrate`; el cliente generado es un paso de build
  más (`prisma generate`) que tiene que correr en Vercel.
- Los CHECK viven fuera del schema: `prisma migrate dev` no los detecta como drift, hay que
  mantenerlos a mano en cada migración que toque esas columnas.
- La conexión WebSocket abre un pool por instancia; con Fluid Compute se reutiliza, pero en un
  pico de instancias frías conviene la URL pooled de Neon (ya es la de `DATABASE_URL`).

## Historial

- 2026-10-26 — v1 (Clase 9).
