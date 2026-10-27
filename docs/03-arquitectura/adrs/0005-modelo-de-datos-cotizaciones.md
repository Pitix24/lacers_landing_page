# ADR 0005: Modelo de datos — cotizaciones, admins y rate limit; catálogo en código

## Estado

Propuesto — decidido por el agente sin entrevista (sesión no interactiva). REVISAR.

## Contexto

El PRD cambió respecto al diseño previo: **no** hay precio en pantalla ni edición de catálogo
desde `/admin` ("el catálogo se mantiene en código"). Las tablas `materials`, `processes` y
`pricing_formula` del ADR-0005 previo quedan sin propósito. Hay que persistir cada solicitud con
sus datos técnicos, resultado del cálculo, contacto y estado; los admins; y los contadores de
rate limit (ADR-0010). DESIGN.md pide badges por estado, código de proyecto en mono y fecha.

## Decisión

**`quotes`**
- `id` uuid PK (`gen_random_uuid()`), `folio` bigserial UNIQUE.
- **Identificador público:** `public_code` = `project_code` + `-` + folio con 6 dígitos
  (ej. `REQ-7075-MC08-000123`), UNIQUE. `project_code` solo no identifica (se repite).
- `submission_key` uuid UNIQUE NOT NULL, `payload_hash` text NOT NULL (ADR-0009).
- `process_id`, `alloy_id` NULL (NULL = "a verificar en banco"), `polymer_id`,
  `geometry_mode` (`cad` | `muestra`), `size_start`, `size_end`, `pairs` smallint, `note` text.
  - `CHECK (pairs = size_end - size_start + 1)`; tallas enteras en rango 15–50 (Zod + CHECK).
  - `pairs` lo calcula el servidor; nunca se acepta del cliente.
- Si no hay aleación, el código usa el token `VRF`: `REQ-VRF-RB08-000124` (no el 7075 por
  defecto que usa hoy el wizard).
- `contact_name` NOT NULL, `contact_company`, `contact_email`, `contact_phone` —
  `CHECK (contact_email IS NOT NULL OR contact_phone IS NOT NULL)`; `privacy_accepted_at`
  timestamptz NOT NULL (ADR-0013).
- `shrinkage_pct` numeric(5,2), `machining_hours_est` numeric(6,1), `estimate_provisional`
  boolean, `calc_version` text.
- `is_special_case` boolean + `special_reasons` text[] (ej. `pairs_gt_30`,
  `size_out_of_usual_range`, `polymer_expansive`).
- `is_spam` boolean default false (honeypot, ADR-0010) — oculto por defecto en el listado.
- `status` enum `quote_status` default `nueva`; `status_changed_at` timestamptz NOT NULL
  default now(); `created_at` timestamptz default now().
- `ip_hash` text NULL — se borra a las 24 h (ADR-0013).
- `anonymized_at` timestamptz NULL (ADR-0013).
- Índices: `(status, created_at desc) WHERE NOT is_spam`, `folio`.

**`admin_users`** — `id`, `email` UNIQUE (minúsculas), `password_hash`, `created_at`.

**`rate_limits`** — `bucket` text PK (ej. `quote:ip:<hash>`, `login:email:<hash>`),
`window_start` timestamptz, `hits` int (ADR-0010).

**Máquina de estados** (validada en servidor):

| Desde | Hacia |
|---|---|
| `nueva` | `en_revision`, `descartada` |
| `en_revision` | `cotizada`, `descartada`, `nueva` |
| `cotizada` | `cerrada`, `descartada`, `en_revision` |
| `descartada` | `en_revision` (reabrir) |
| `cerrada` | `cotizada` (reabrir) |

`cerrada` = cotización aceptada por el cliente / trabajo concretado; `descartada` = no avanza
(perdida, spam no detectado, incompleta). REVISAR semántica con el usuario.

**Catálogo:** un único `POLYMERS` tipado en `src/data/catalog.ts` (id canónico, factor de
contracción, `isExpansive`) alimenta la tabla de la landing y el wizard; los ids actuales del
wizard (`caucho`) y de la tabla (`rubber`) se unifican **antes de la primera migración**. 6061
entra con id `6061-t6` (temple a confirmar). Ids de catálogo como texto sin FK.

## Alternativas consideradas

- **Catálogo también en tablas con FK** — integridad referencial en la base, pero duplica la
  fuente de verdad que el PRD deja en código y requeriría sincronizar seeds en cada cambio.
- **Una columna JSONB con el payload completo** — cero migraciones al cambiar el wizard, pero
  pierde constraints, filtros y tipado.
- **Tabla `quote_status_history`** — trazabilidad completa de cambios, pero el PRD pide solo
  "fecha del último cambio" y excluye la auditoría detallada.

## Consecuencias

- Esquema chico, tipado y con constraints que respaldan la validación de Zod.
- Los ids de catálogo y los del código quedan fijos desde la primera fila en producción;
  renombrar luego exige una migración de datos. Si se elimina un id del código, el panel muestra
  el id crudo.
- Sin historial de estados: un cambio erróneo se corrige reabriendo, pero no queda quién ni
  cuándo pasó por cada estado.
- El folio secuencial revela el volumen de solicitudes a quien compare dos códigos; aceptado.

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (A2, A3, A4, A7, A10, C3, C4): `public_code` único, token
  `VRF`, tallas enteras y `pairs` calculado, `payload_hash`, `special_reasons`, `is_spam`,
  `rate_limits`, reapertura de estados, unificación de polímeros, campos de privacidad.
