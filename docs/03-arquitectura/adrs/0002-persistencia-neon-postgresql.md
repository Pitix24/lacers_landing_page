# ADR 0002: Persistencia en PostgreSQL (Neon)

## Estado

Aceptado (mandato del curso)

## Contexto

El PRD exige que "el 100 % de los envíos válidos del wizard generen una fila en la tabla de
cotizaciones de Neon" y que el ingeniero gestione estados desde `/admin`. Mandato del curso: la
base de persistencia **debe** ser PostgreSQL en Neon. Las Functions de Vercel son efímeras y no
tienen disco persistente.

## Decisión

Una base PostgreSQL en Neon (plan free) con **dos ramas fijas**:

- `main` — producción. Solo la usa el entorno Production de Vercel.
- `dev` — desarrollo local, previews y tests; creada **solo con esquema** (o vaciada tras
  crearla) y poblada con datos sintéticos. Nunca contiene datos personales reales.

No se usa una rama Neon por preview. Variables por entorno en Vercel:
`DATABASE_URL` (URL *pooled*, runtime) y `DATABASE_URL_UNPOOLED` (URL directa, solo
migraciones), con scope explícito Production → `main`, Preview/Development → `dev`.

## Alternativas consideradas

- **Supabase** — Postgres + auth incluida, descartada por el mandato.
- **SQLite / Turso** — más simple para el volumen, pero no cumple el mandato y Turso agregaría
  otro proveedor.
- **Rama Neon por preview (integración Vercel–Neon)** — aislamiento perfecto, pero las ramas
  hijas copian los datos personales de producción, consumen el cupo de ramas del free tier y
  multiplican las migraciones a aplicar.

## Consecuencias

- Postgres real (constraints, `UNIQUE`, upserts atómicos) para sostener idempotencia, rate
  limit y estados.
- El free tier de Neon suspende el cómputo por inactividad: la primera request tras un rato
  paga un *cold start* de la base (cientos de ms a ~1-2 s). Con poco tráfico será lo habitual;
  el timeout del cliente (ADR-0011) lo contempla.
- Los previews comparten la rama `dev`: dos previews con migraciones incompatibles se pisan.
  Aceptable con un solo desarrollador; las migraciones deben ser *expand/contract* (ADR-0004).
- Límite de almacenamiento del free tier (orden de 0,5 GB): suficiente para años de
  solicitudes de texto, pero exige no guardar blobs.

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (A8): ramas fijas `main`/`dev` sin PII, URLs pooled vs
  unpooled y scope por entorno.
