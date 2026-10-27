import { calcularEstimacion } from '../src/lib/cotizador/calc.js'
import type { QuoteCreatedResponse } from '../src/lib/cotizador/api.js'
import { quoteRequestInputSchema } from '../src/lib/cotizador/schema.js'
import { apiError, canonicalHash, json, logEvent, readJsonBody } from '../server/http.js'
import { getQuotesRepo, type StoredQuote } from '../server/quotes-repo.js'

// POST /api/quotes — alta pública de una solicitud del Cotizador Técnico (ADR-0006, ADR-0009).
// Pendiente de spec-02: rate limit por IP (ADR-0010) y cron de retención (ADR-0013).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function created(quote: StoredQuote, storage: QuoteCreatedResponse['storage'], status: 200 | 201): Response {
  const body: QuoteCreatedResponse = {
    publicCode: quote.publicCode,
    projectCode: quote.projectCode,
    pairs: quote.pairs,
    shrinkagePct: quote.shrinkagePct,
    specialReasons: quote.specialReasons,
    createdAt: quote.createdAt,
    storage,
  }
  return json(body, status, { 'Cache-Control': 'no-store' })
}

function replayOrConflict(existing: StoredQuote, payloadHash: string, storage: QuoteCreatedResponse['storage']): Response {
  if (existing.payloadHash !== payloadHash) {
    return apiError(409, 'IDEMPOTENCY_KEY_REUSED', `Tu solicitud anterior ya quedó registrada (código ${existing.publicCode}).`, {
      publicCode: existing.publicCode,
    })
  }
  return created(existing, storage, 200)
}

export async function POST(request: Request): Promise<Response> {
  const key = request.headers.get('idempotency-key') ?? ''
  if (!UUID_RE.test(key)) {
    return apiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Falta el header Idempotency-Key (UUID).')
  }

  const body = await readJsonBody(request)
  if (!body.ok) return body.response

  const repo = getQuotesRepo()
  if (!repo) {
    logEvent('quote.db_unavailable', { reason: 'DATABASE_URL ausente' })
    return apiError(503, 'DB_UNAVAILABLE', 'No pudimos registrar la solicitud. Probá de nuevo o escribinos por WhatsApp.')
  }

  const parsed = quoteRequestInputSchema.safeParse(body.value)
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join('.'), issue.message]))
    return apiError(400, 'VALIDATION_ERROR', 'Revisá los datos de la solicitud.', fields)
  }
  const { website, ...data } = parsed.data
  const payloadHash = canonicalHash(data)

  try {
    // Dos vueltas como máximo: si el insert pierde la carrera contra la misma clave, se resuelve como replay.
    for (let attempt = 0; attempt < 2; attempt++) {
      const existing = await repo.findBySubmissionKey(key)
      if (existing) return replayOrConflict(existing, payloadHash, repo.storage)

      const estimate = calcularEstimacion(data)
      const isSpam = Boolean(website)
      const row = await repo.create({ submissionKey: key, payloadHash, data, estimate, isSpam })
      if (row) {
        logEvent('quote.created', { publicCode: row.publicCode, storage: repo.storage, isSpam, special: estimate.specialReasons })
        return created(row, repo.storage, 201)
      }
    }
    return apiError(503, 'DB_UNAVAILABLE', 'No pudimos registrar la solicitud. Probá de nuevo.')
  } catch (err) {
    // Solo el código: el mensaje de Prisma puede incluir los argumentos de la query (datos de contacto).
    logEvent('quote.db_error', { code: (err as { code?: string } | null)?.code ?? (err instanceof Error ? err.name : 'unknown') })
    return apiError(503, 'DB_UNAVAILABLE', 'No pudimos registrar la solicitud. Probá de nuevo o escribinos por WhatsApp.')
  }
}
