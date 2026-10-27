# ADR 0010: Protección anti-spam y rate limit

## Estado

Propuesto — decidido por el agente sin entrevista (sesión no interactiva). REVISAR.

## Contexto

PRD: "límite de tasa básico por IP en el endpoint público" y riesgo de spam. Las Functions no
comparten memoria (ADR-0001). La v1 (contar filas de `quotes` por IP y después insertar) tenía
una carrera (N requests concurrentes pasan todas el conteo), solo contaba envíos exitosos (los
400 no tenían límite) y bloqueaba replays legítimos.

## Decisión

- Contador atómico en la tabla `rate_limits` (ADR-0005), ventana fija, en **una sentencia**:

  ```sql
  INSERT INTO rate_limits (bucket, window_start, hits) VALUES ($1, now(), 1)
  ON CONFLICT (bucket) DO UPDATE SET
    hits = CASE WHEN rate_limits.window_start < now() - $2::interval THEN 1
                ELSE rate_limits.hits + 1 END,
    window_start = CASE WHEN rate_limits.window_start < now() - $2::interval THEN now()
                        ELSE rate_limits.window_start END
  RETURNING hits;
  ```

  El bloqueo de fila del upsert serializa las requests concurrentes del mismo bucket.
- Se cuenta **cada intento**, válido o inválido, salvo los replays idempotentes (ADR-0009):
  - `POST /api/quotes`: 5 por IP cada 10 min → 429 + `Retry-After`.
  - `POST /api/admin/login`: 5 por IP y 5 por email cada 15 min (ADR-0008).
- IP con `ipAddress(request)` de `@vercel/functions` (Vercel sobreescribe `x-forwarded-for`);
  IPv6 agrupada por /64; sin IP → bucket `unknown` con el mismo límite. Bucket =
  `sha256(prefijo + IP + IP_HASH_SALT)`.
- **Honeypot:** campo oculto con nombre no estándar, `autocomplete="off"`, `tabindex="-1"`,
  `aria-hidden`. Si viene con contenido, la solicitud **se persiste con `is_spam = true`** y se
  responde normal (folio real). El listado oculta spam por defecto, con filtro para verlo.
- Limpieza: filas de `rate_limits` con `window_start` > 24 h se borran en el cron diario
  (ADR-0013).

## Alternativas consideradas

- **Vercel Firewall (reglas de rate limit)** — sin código y antes de invocar la Function, pero su
  disponibilidad/cupo en Hobby es limitado y la configuración vive fuera del repo.
- **Upstash Redis** — ventana deslizante estándar, pero suma proveedor y secreto para un volumen
  bajo.
- **Contar filas de `quotes`** (v1) — sin tabla extra, pero con carrera y sin contar intentos
  inválidos.

## Consecuencias

- Límite correcto bajo concurrencia, sin infraestructura extra.
- Una sentencia más por envío/login y una tabla que hay que limpiar.
- Ventana fija: permite ráfagas de hasta 2× el límite en el borde entre ventanas; aceptable para
  un límite "básico".
- Un atacante con muchas IPs lo esquiva; protege contra abuso casual, no contra ataques
  distribuidos. Clientes detrás de una misma IP corporativa comparten cupo.
- Un envío legítimo con el honeypot lleno (autocompletado raro) no se pierde: queda marcado como
  spam y el admin puede verlo.

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (C3, A5, A7, S1): upsert atómico, contar intentos, login
  limitado, `ipAddress()`, /64, honeypot que persiste con `is_spam`.
