import { QUOTE_STATUSES, type AdminQuotesResponse, type QuoteStatus } from '../../src/lib/cotizador/api.js'
import { apiError, json, logEvent, requireAdmin } from '../../server/http.js'
import { getQuotesRepo } from '../../server/quotes-repo.js'

// GET /api/admin/quotes?status=&q=&spam= — listado del panel /admin (ADR-0006).
// Paginación por cursor y PATCH de estado quedan para spec-04.

const LIMIT = 100

export async function GET(request: Request): Promise<Response> {
  const denied = requireAdmin(request)
  if (denied) return denied

  const params = new URL(request.url).searchParams
  const status = params.get('status') || undefined
  if (status && !QUOTE_STATUSES.includes(status as QuoteStatus)) {
    return apiError(400, 'VALIDATION_ERROR', 'Estado inválido.', { status: `Valores: ${QUOTE_STATUSES.join(', ')}` })
  }

  const repo = getQuotesRepo()
  if (!repo) return apiError(503, 'DB_UNAVAILABLE', 'La base de datos no está configurada.')

  try {
    const rows = await repo.list({
      status: status as QuoteStatus | undefined,
      q: params.get('q')?.slice(0, 64) || undefined,
      includeSpam: params.get('spam') === '1',
      limit: LIMIT,
    })
    const body: AdminQuotesResponse = {
      items: rows.map(({ payloadHash: _hash, ...row }) => row),
      storage: repo.storage,
    }
    return json(body, 200, { 'Cache-Control': 'no-store' })
  } catch (err) {
    logEvent('admin.quotes.db_error', { message: err instanceof Error ? err.message : String(err) })
    return apiError(503, 'DB_UNAVAILABLE', 'No pudimos leer las cotizaciones.')
  }
}
