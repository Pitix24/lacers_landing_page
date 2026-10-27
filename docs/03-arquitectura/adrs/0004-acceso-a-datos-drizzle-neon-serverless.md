# ADR 0004: Acceso a datos — Drizzle ORM sobre `@neondatabase/serverless`

## Estado

Reemplazado por [ADR-0014](0014-acceso-a-datos-prisma-neon.md) (Prisma 7 + `@prisma/adapter-neon`).
Antes: Aceptado (heredado)

## Contexto

`CLAUDE.md` y el ADR-0007 previo fijan "Neon vía Drizzle". El mandato del curso pide usar
Prisma o `@neondatabase/serverless`. Drizzle no reemplaza al driver: corre **sobre**
`@neondatabase/serverless` (adaptador `drizzle-orm/neon-http`), así que la decisión heredada es
compatible con el mandato.

## Decisión

- `drizzle-orm` + adaptador `neon-http` sobre `@neondatabase/serverless` para queries, usando
  `DATABASE_URL` (pooled).
- `drizzle-kit` genera migraciones SQL versionadas en `drizzle/`; se aplican con
  `DATABASE_URL_UNPOOLED` (conexión directa, recomendada por Neon para DDL).
- Atomicidad: preferir **una sola sentencia** (`INSERT … ON CONFLICT`, `UPDATE … WHERE`). Si hace
  falta más de una, usar transacciones **no interactivas** del driver HTTP (`db.batch([...])` /
  `sql.transaction([...])`). Transacciones interactivas (leer y decidir en medio) requerirían el
  modo WebSocket (`Pool`); hoy ningún flujo las necesita.
- **Flujo de migraciones:** migrar `dev` → probar en preview → migrar `main` → promover/mergear.
  Migraciones *expand/contract* (agregar antes de usar, quitar después de dejar de usar), para
  que el código desplegado nunca dependa de una migración no aplicada.

## Consecuencias

- Queries tipadas, sin conexiones TCP persistentes, bundle chico y buen arranque en Functions.
- Las migraciones siguen siendo un paso manual del desarrollador, con una regla escrita de
  orden; olvidarla rompe producción con 500 hasta que se migra.
- Restringirse a sentencias únicas o batches condiciona cómo se escriben los handlers (ver
  ADR-0009 y ADR-0010).

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (C3, A8): se corrige que el driver HTTP "no soporta
  transacciones" (sí soporta no interactivas), URL directa para migraciones y orden migración →
  deploy.
