# Tasks — spec-02-api-cotizaciones

## 1. Librería compartida (`src/lib/cotizador/`)
- [x] 1.1 `schema.ts`: Zod del request con mensajes en voseo (tallas 15–50, email o teléfono, privacidad)
- [x] 1.2 `api.ts`: tipos de contrato y forma de error (ADR-0006), sin Zod para no inflar chunks
- [x] 1.3 `calc.ts`: `calcularEstimacion` (pares, `projectCode` con token `VRF`, contracción, `special_reasons`), `buildPublicCode`, `CALC_VERSION`
- [ ] 1.4 Horas de mecanizado — **bloqueado:** faltan los coeficientes por proceso/aleación/par

## 2. `POST /api/quotes`
- [x] 2.1 `Idempotency-Key` obligatorio (UUID) → 400
- [x] 2.2 Validación Zod → 400 `VALIDATION_ERROR` con `fields`
- [x] 2.3 Replay 200 con el mismo `payload_hash`; 409 `IDEMPOTENCY_KEY_REUSED` con payload distinto
- [x] 2.4 Carrera por `UNIQUE(submission_key)` resuelta como replay
- [x] 2.5 Honeypot → `is_spam`; límite de 16 kB → 413; 405 en otros métodos
- [x] 2.6 Sin base en producción → 503 `DB_UNAVAILABLE`; memoria solo en local/test
- [x] 2.7 Logging JSON sin PII
- [ ] 2.8 Rate limit por IP (ADR-0010), `ip_hash` y purga a 24 h (ADR-0013)
- [ ] 2.9 `calcVersionChanged` en la respuesta

## 3. Operación
- [x] 3.1 `GET /api/health` (`SELECT 1`)
- [ ] 3.2 `GET /api/cron/retention` con `CRON_SECRET` (ADR-0013)

## 4. Verificación
- [x] 4.1 `npm run build` pasa
- [x] 4.2 Prueba manual de handlers: 201, 200 replay, 409, 400, 503 en producción sin base
- [ ] 4.3 Tests Vitest (tabla proceso × aleación × polímero, Zod, hash) y handlers contra `dev`
