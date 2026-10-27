# ADR 0007: Stack backend — cliente de base de datos

## Estado

Aceptado

## Contexto

Neon exige un driver serverless (`@neondatabase/serverless`) o pooler para conexiones desde
Vercel Functions ([ADR-0002](0002-motor-de-base-de-datos.md)). El equipo es de una sola
persona y el schema es chico ([ADR-0005](0005-modelo-de-datos.md)) pero se va a tocar seguido
al iterar reglas de precio.

## Decisión

Drizzle ORM sobre `@neondatabase/serverless`, con `drizzle-kit` para migraciones.

## Alternativas consideradas

- **Prisma** — mejor documentación y DX histórica, pero descartado por mayor tamaño de bundle
  y overhead de cold-start en funciones serverless, relevante en el free tier de Vercel donde
  el tiempo de ejecución de Functions cuenta contra el límite del plan.
- **SQL crudo + driver de Neon** — cero abstracción y control total, pero descartado porque
  obliga a escribir y mantener a mano el tipado de cada query y las migraciones, sin red de
  seguridad ante errores de tipeo en columnas — riesgo innecesario para un equipo de una
  persona.

## Consecuencias

- Queries tipadas en TypeScript, migraciones versionadas con `drizzle-kit`, bajo overhead de
  arranque en Functions.
- Drizzle es menos maduro en ecosistema/documentación que Prisma — menos respuestas
  pre-hechas si aparece un caso de uso avanzado (ej. transacciones complejas).
