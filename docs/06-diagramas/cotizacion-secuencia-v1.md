# Secuencia — Cotización Técnica CNC (v1)

> Flujo completo de una solicitud del Cotizador Técnico, desde el wizard en `/cotizador-tecnico`
> hasta la validación y persistencia en Neon PostgreSQL. Derivado del código actual (no del
> diseño objetivo): lo pendiente de specs futuras se marca como tal.
>
> Versión visualizable en navegador: [cotizacion-secuencia-v1.html](cotizacion-secuencia-v1.html).

## Grafo de componentes y llamadas

| Capa | Archivo | Responsabilidad en el flujo |
| --- | --- | --- |
| SPA | `src/components/CotizadorTecnico.tsx` | Estado del wizard (4 pasos), arma `QuoteRequestInput`, genera y reutiliza la `Idempotency-Key` (`crypto.randomUUID()`), muestra ficha o errores. |
| SPA | `src/lib/cotizador/client.ts` | `submitQuote()`: `fetch POST /api/quotes` con timeout de 20 s (ADR-0011) y mapeo a `SubmitQuoteResult` (`validation` / `key_reused` / `unavailable`). |
| Function | `api/quotes.ts` | Handler `POST`: header de idempotencia, body, Zod, deduplicación, cálculo y alta (ADR-0006, ADR-0009). |
| Servidor | `server/http.ts` | `readJsonBody` (límite 16 kB), `canonicalHash` (sha256 con claves ordenadas), `apiError`, `json`, `logEvent` sin PII. |
| Compartido | `src/lib/cotizador/schema.ts` | `quoteRequestInputSchema` (Zod): catálogo, tallas 15–50, contacto, privacidad, honeypot `website` (ADR-0007, ADR-0010). |
| Compartido | `src/lib/cotizador/calc.ts` | `calcularEstimacion()` (pares, `projectCode`, contracción, casos especiales) y `buildPublicCode()`. El servidor siempre recalcula. |
| Servidor | `server/quotes-repo.ts` | `getQuotesRepo()` → repo Prisma (Neon) o memoria (solo local sin `DATABASE_URL`); `findBySubmissionKey`, `create`. |
| Servidor | `server/neon.ts` | `getPrisma()`: `PrismaClient` + `@prisma/adapter-neon`, instancia única por proceso (ADR-0014). |
| Datos | `prisma/schema.prisma` | Tabla `quote_requests`: `submission_key` y `public_code` únicos, `folio` autoincremental. |

## Diagrama de secuencia

```mermaid
sequenceDiagram
    autonumber
    actor U as Cliente (fabricante)
    participant W as CotizadorTecnico.tsx<br/>(Wizard React)
    participant C as client.ts<br/>submitQuote()
    participant A as api/quotes.ts<br/>POST handler
    participant H as server/http.ts
    participant Z as schema.ts<br/>(Zod)
    participant K as calc.ts
    participant R as quotes-repo.ts<br/>(prismaRepo)
    participant P as neon.ts<br/>PrismaClient + adapter-neon
    participant DB as Neon PostgreSQL<br/>quote_requests

    %% ── 1. Configuración en el wizard (solo estado local de React) ──
    rect rgba(40, 44, 52, 0.35)
        Note over U,W: Paso 1 a 4 en /cotizador-tecnico (estado local, sin red)
        U->>W: Elige requerimiento (processId) y aleación (alloyId o "a verificar")
        U->>W: Elige polímero (polymerId) y modo de geometría (cad | muestra)
        U->>W: Define curva de tallas (sizeStart, sizeEnd)
        W->>W: Preview: pares = fin - inicio + 1<br/>código REQ-aleación-procesoPP
        U->>W: Completa contacto, acepta privacidad
        W->>W: canSubmit = ready y contactReady y fase distinta de sending
    end

    %% ── 2. Envío desde el cliente ──
    U->>+W: Click en "Enviar solicitud"
    W->>W: handleSubmit(): arma QuoteRequestInput<br/>(incluye honeypot website)
    alt payload cambió o forceNewKey
        W->>W: submission.current = crypto.randomUUID() + payload
    else mismo payload que el intento anterior
        W->>W: Reutiliza la misma Idempotency-Key (ADR-0009)
    end
    W->>W: setSubmit(phase: sending)
    W->>+C: submitQuote(input, idempotencyKey)
    C->>C: AbortController, timeout 20 s (ADR-0011)
    C->>+A: POST /api/quotes<br/>Content-Type: application/json<br/>Idempotency-Key: uuid

    %% ── 3. Validaciones de entrada ──
    A->>A: UUID_RE.test(Idempotency-Key)
    alt Header ausente o no es UUID
        A-->>C: 400 IDEMPOTENCY_KEY_REQUIRED
    end
    A->>+H: readJsonBody(request)
    H-->>-A: ok + value | 413 PAYLOAD_TOO_LARGE (16 kB) | 400 INVALID_JSON
    alt Body inválido o demasiado grande
        A-->>C: 413 / 400 con ApiErrorBody
    end
    A->>+Z: quoteRequestInputSchema.safeParse(body)
    Z-->>-A: success + data | issues
    alt Falla la validación Zod
        A->>H: apiError(400, VALIDATION_ERROR, fields por path)
        A-->>C: 400 VALIDATION_ERROR + fields
    end
    A->>A: Separa honeypot: website y data
    A->>+H: canonicalHash(data)
    H-->>-A: payloadHash (sha256, claves ordenadas)

    %% ── 4. Selección de almacenamiento ──
    A->>+R: getQuotesRepo()
    R->>P: isDatabaseConfigured() / isMemoryFallbackAllowed()
    R-->>-A: prismaRepo | memoryRepo (solo local) | null
    alt repo = null (producción sin DATABASE_URL)
        A->>H: logEvent(quote.db_unavailable)
        A-->>C: 503 DB_UNAVAILABLE
    end

    %% ── 5. Idempotencia + persistencia (máx. 2 vueltas) ──
    loop attempt 0..1 (resuelve la carrera de doble envío)
        A->>+R: findBySubmissionKey(key)
        R->>+P: getPrisma()
        P-->>-R: PrismaClient (singleton por instancia Fluid)
        R->>+DB: SELECT * FROM quote_requests WHERE submission_key = key
        DB-->>-R: fila | vacío
        R-->>-A: StoredQuote | null

        alt Ya existe con otro payloadHash
            A-->>C: 409 IDEMPOTENCY_KEY_REUSED + publicCode existente
        else Ya existe con el mismo payloadHash (replay)
            A-->>C: 200 QuoteCreatedResponse (registro original)
        else No existe
            A->>+K: calcularEstimacion(data)
            K-->>-A: pairs, projectCode, shrinkagePct, specialReasons<br/>(pairs_gt_30, polymer_expansive)
            A->>A: isSpam = Boolean(website)
            A->>+R: create(submissionKey, payloadHash, data, estimate, isSpam)
            R->>+DB: BEGIN
            R->>DB: INSERT quote_requests (status = nueva,<br/>calcVersion, privacyAcceptedAt = now)
            DB-->>R: fila con folio autoincremental
            R->>K: buildPublicCode(projectCode, folio)
            K-->>R: REQ-7075-MC08-000123
            R->>DB: UPDATE quote_requests SET public_code WHERE id
            R->>DB: COMMIT
            DB-->>-R: fila final
            alt P2002 unique violation (otra request ganó la carrera)
                R-->>A: null, reintenta la vuelta y resuelve como replay
            else Insert OK
                R-->>-A: StoredQuote
                A->>H: logEvent(quote.created, publicCode, isSpam, special) sin PII
                A-->>C: 201 QuoteCreatedResponse<br/>Cache-Control: no-store
            end
        end
    end

    opt Error de Prisma / Neon (catch)
        A->>H: logEvent(quote.db_error)
        A-->>-C: 503 DB_UNAVAILABLE
    end

    %% ── 6. Respuesta en el wizard ──
    alt 200 / 201
        C-->>W: ok: true, quote
        W->>W: submission.current = null<br/>setSubmit(done), abre ficha
        W-->>U: Ficha con publicCode, pares y contracción
    else 400
        C-->>W: kind: validation + fields
        W-->>U: Errores por campo (FieldError)
    else 409
        C-->>W: kind: key_reused + publicCode
        W-->>U: "Tu solicitud ya quedó registrada" + opción de nuevo envío
    else 503 / timeout / red
        C-->>-W: kind: unavailable
        W-->>-U: Reintentar (misma key) o fallback por WhatsApp
    end
```

## Notas

- **El cliente no es fuente de verdad:** `pairs`, `projectCode`, `shrinkagePct` y
  `specialReasons` los recalcula el servidor con `calcularEstimacion()`; el wizard solo los usa
  como preview.
- **Honeypot (ADR-0010):** si `website` viene con valor, la solicitud se guarda igual con
  `isSpam = true` (respuesta 201 indistinguible) y queda oculta en el listado admin por defecto.
- **Idempotencia (ADR-0009):** la misma key con el mismo payload devuelve `200` con el registro
  original; con otro payload, `409`. La carrera entre dos inserts se resuelve por la restricción
  única de `submission_key` (`P2002`) y una segunda vuelta del loop.
- **Fallback en memoria:** sin `DATABASE_URL`, en local/test `getQuotesRepo()` devuelve
  `memoryRepo` (`storage: 'memory'`); en Vercel responde `503`.
- **Pendiente (spec-02):** rate limit por IP (ADR-0010) y cron de retención/anonimización
  (ADR-0013) todavía no están en el flujo.
