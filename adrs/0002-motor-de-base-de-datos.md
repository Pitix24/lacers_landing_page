# ADR 0002: Motor de base de datos

## Estado

Aceptado

## Contexto

El PRD ahora requiere persistir cotizaciones y una tabla de precios editable desde un panel
admin. El usuario estableció como requisito mandatorio usar **PostgreSQL en el servicio de
Neon**.

## Decisión

PostgreSQL gestionado por Neon.

## Alternativas consideradas

- **Supabase** (Postgres + auth + API autogenerada) — hubiera simplificado la autenticación
  admin, pero descartado porque el requisito mandatorio pide específicamente Neon.
- **Vercel Postgres** — ya no se ofrece como producto (discontinuado), no es opción vigente.
- **SQLite embebido / Turso** — no apto sin un servicio de DB remoto propio, porque las
  Vercel Functions son efímeras entre invocaciones (no hay disco persistente local).

## Consecuencias

- Neon tiene tier gratuito y soporta conexiones vía driver serverless (HTTP/WebSocket),
  compatible con el entorno efímero de Vercel Functions.
- Las conexiones TCP tradicionales de larga vida no son ideales en serverless — obliga a usar
  el driver serverless de Neon (`@neondatabase/serverless`) o su pooler integrado, lo cual
  condiciona la elección de cliente de base de datos en el stack backend (ver ADR
  correspondiente).
