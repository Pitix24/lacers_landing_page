# ADR 0009: Idempotencia en el envío de cotizaciones

## Estado

Aceptado (mandato del usuario). Mecanismo propuesto por el agente — REVISAR.

## Contexto

PRD, casos borde: ante falla de red o de Neon "no se pierde la solicitud ni se duplica en
reintentos (idempotencia por clave de envío)", y doble clic en "Enviar". Con Neon en
*cold start* (ADR-0002), un timeout del cliente seguido de reintento es un escenario real: el
primer insert pudo haberse completado. Entre el intento fallido y el reintento, el usuario puede
**editar** el borrador.

## Decisión

- **Ciclo de vida de la clave:** el wizard genera la `submission_key` (`crypto.randomUUID()`)
  **al tocar "Enviar"** (no al iniciar el borrador) y la guarda en `localStorage` junto con el
  hash del payload enviado. Se reutiliza en reintentos **mientras el payload no cambie**; si el
  usuario edita algo después de un intento fallido o ambiguo, se genera una clave nueva. Se
  descarta tras 200/201.
- Header `Idempotency-Key` obligatorio (UUID); si falta o es inválido → 400.
- `payload_hash` = sha256 del payload **canónico ya validado** por Zod (claves ordenadas).
- Orden en el handler (el flujo completo está en TECH-DESIGN.md):
  1. Validar el header y el body con Zod (un body inválido suma al rate limit y responde 400,
     ver ADR-0010). Calcular el `payload_hash`.
  2. `SELECT … WHERE submission_key = $k`. Si existe: mismo `payload_hash` → **200** con el
     cuerpo original (`public_code`, valores persistidos); distinto → **409
     `IDEMPOTENCY_KEY_REUSED`** con el `public_code` existente. Los replays no pasan por el rate
     limit.
  3. Si no existe: rate limit → cálculo → `INSERT … ON CONFLICT (submission_key) DO NOTHING
     RETURNING …`. Si el insert no devuelve fila (carrera con otra request de la misma clave),
     se vuelve al paso 2.
- Ante 409 `IDEMPOTENCY_KEY_REUSED`, la UI muestra "Tu solicitud anterior ya quedó registrada
  (código X). ¿Querés enviar los cambios como una nueva solicitud?"; si acepta, clave nueva.
- El botón "Enviar" se deshabilita mientras la request está en curso.

## Alternativas consideradas

- **Tabla separada `idempotency_keys`** con respuesta cacheada y TTL — patrón general, pero
  sobredimensionado para un único endpoint de creación.
- **Deduplicación por contenido** (hash de payload + contacto en ventana de tiempo) — no
  necesita clave en el cliente, pero confunde dos pedidos legítimos idénticos con un duplicado.
- **"Primer envío gana" en silencio** (v1) — más simple, pero descarta sin avisar las
  correcciones del usuario y le muestra éxito.

## Consecuencias

- Reintentos seguros sin duplicados ni pérdida silenciosa de ediciones, garantizado por el
  `UNIQUE` de Postgres, compatible con el driver HTTP (ADR-0004).
- Una query extra (`SELECT` por clave) en cada envío.
- Dos pestañas con el mismo borrador comparten `localStorage`: si ambas envían el mismo payload
  se deduplica; si difieren, la segunda recibe 409 y decide. Si el usuario borra
  `localStorage` o cambia de dispositivo, puede duplicarse; aceptable.

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (C3, C4): `payload_hash` y 409 por reuso con otro payload,
  clave generada al enviar y rotada al editar, header obligatorio, replay antes del rate limit.
