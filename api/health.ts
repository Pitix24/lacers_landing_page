import { json } from '../server/http.js'
import { getPrisma, isDatabaseConfigured, isMemoryFallbackAllowed } from '../server/neon.js'

// GET /api/health — 200 si la base responde a SELECT 1; 503 si no (ADR-0006).
export async function GET(): Promise<Response> {
  const headers = { 'Cache-Control': 'no-store' }
  if (!isDatabaseConfigured()) {
    return isMemoryFallbackAllowed()
      ? json({ status: 'ok', storage: 'memory' }, 200, headers)
      : json({ status: 'error', storage: 'none' }, 503, headers)
  }
  try {
    await getPrisma().$queryRaw`SELECT 1`
    return json({ status: 'ok', storage: 'database' }, 200, headers)
  } catch {
    return json({ status: 'error', storage: 'database' }, 503, headers)
  }
}
