# spec-01-persistencia-neon

Backlog #1: persistencia PostgreSQL (Neon) + esquema **Prisma** de cotizaciones CNC
(D1 resuelto en [ADR-0014](../../../docs/03-arquitectura/adrs/0014-acceso-a-datos-prisma-neon.md)).

**Estado:** En implementación (Clase 9, 2026-10-26). Código listo; migración y seed aplicados en
producción y spike de plataforma verificada en el deploy del 2026-10-27. Falta aplicar la migración
en la rama `dev` de Neon. Avance en [`tasks.md`](tasks.md).

Archivos: `prisma/schema.prisma`, `prisma/migrations/20261026000000_init/`, `prisma.config.ts`,
`prisma/seed.ts`, `server/neon.ts`, `.env.example`, `tsconfig.api.json`, `vercel.json`.
