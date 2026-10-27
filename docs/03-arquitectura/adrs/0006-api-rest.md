# ADR 0006: Arquitectura de API REST

## Estado

Aceptado (mandato del usuario)

## Contexto

La SPA necesita: enviar solicitudes (público), autenticar al admin, listar/ver/cambiar estado
de solicitudes (admin). El plan Hobby limita la cantidad de Functions por deploy (ADR-0001).

## Decisión

REST + JSON sobre `/api`, un archivo de Function por recurso, handlers con la firma estándar
Web (`export async function POST(request: Request): Promise<Response>`):

| Método | Ruta | Auth | Respuestas |
|---|---|---|---|
| POST | `/api/quotes` | pública + `Idempotency-Key` | 201 · 200 replay · 400 · 409 · 413 · 429 · 503 |
| POST | `/api/admin/login` | Origin | 204 + `Set-Cookie` · 401 · 429 |
| POST | `/api/admin/logout` | cookie + Origin | 204 |
| GET | `/api/admin/session` | cookie | 200 `{ email }` · 401 |
| GET | `/api/admin/quotes?status=&q=&cursor=&spam=` | cookie | 200 lista paginada · 401 |
| GET | `/api/admin/quotes/[id]` | cookie | 200 · 401 · 404 |
| PATCH | `/api/admin/quotes/[id]` `{ status }` | cookie + Origin | 200 · 400 · 401 · 404 · 409 |
| GET | `/api/health` | pública | 200 / 503 (`SELECT 1`) |

- `q` busca por `public_code` o folio (el cliente cita ese código por WhatsApp).
- Métodos no soportados → 405. Cuerpos > 16 kB → 413.
- `PATCH` al mismo estado actual → 200 sin cambios (idempotente). Si el `UPDATE` afecta 0 filas,
  un `SELECT` distingue 404 (no existe) de 409 (transición no permitida).
- Todas las respuestas `/api/admin/*` llevan `Cache-Control: no-store`.
- Errores con forma única: `{ "error": { "code": "VALIDATION_ERROR", "message": "…",
  "fields": { … } } }`.
- Request **y response** tienen esquema Zod en `src/lib/cotizador/api.ts`; el cliente hace
  `parse` de las respuestas, así una divergencia de contrato es un error explícito.

## Alternativas consideradas

- **tRPC** — tipado end-to-end automático, pero suma un paradigma y su adaptador para Vercel
  Functions sin Next; con 8 endpoints, los esquemas compartidos alcanzan.
- **Una sola Function "router"** (`api/[...path].ts`) — menos cold starts (una instancia
  caliente sirve todo) y ningún riesgo de límite de Functions, pero mezcla auth pública y admin en
  un archivo y obliga a hacer routing manual.

## Consecuencias

- Endpoints probables con curl y con Playwright sin tooling extra; 7 archivos de Function (GET y PATCH de `[id]` comparten archivo), por debajo del
  límite de Hobby (verificar el número vigente en la spike).
- Con poco tráfico, abrir el admin despierta varias Functions frías más el cold start de Neon:
  la primera carga del panel puede tardar algunos segundos. Aceptado; si molesta, la alternativa
  "router" es la salida.

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (A4, A6, A12, A3, S3, S4): búsqueda por código, `/api/health`,
  PATCH idempotente, 404 vs 409, 405/413, `no-store`, Origin, esquemas de respuesta, costo de
  cold starts.
