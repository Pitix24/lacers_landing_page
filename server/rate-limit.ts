import { createHash } from 'node:crypto'
import { logEvent } from './http.js'
import { getPrisma, isDatabaseConfigured } from './neon.js'

// Rate limit de ventana fija sobre la tabla rate_limits (ADR-0010). Un único upsert: el bloqueo
// de fila serializa las requests concurrentes del mismo bucket, sin carrera de conteo.

export type RateLimitResult = { limited: false } | { limited: true; retryAfterSeconds: number }

export const QUOTES_LIMIT = { scope: 'quotes', max: 5, windowSeconds: 10 * 60 } as const

/**
 * IP del cliente. En Vercel `x-real-ip` / `x-forwarded-for` los escribe la plataforma (no los
 * controla el cliente). Sin IP → bucket compartido `unknown` con el mismo límite.
 */
export function clientIp(request: Request): string {
  const raw = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]
  return raw?.trim() || 'unknown'
}

/** IPv4 tal cual; IPv6 agrupada por /64 (un mismo cliente suele controlar el /64 entero). */
export function ipPrefix(ip: string): string {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)
  if (mapped) return mapped[1]
  if (!ip.includes(':')) return ip
  const [head = '', tail = ''] = ip.split('%')[0].split('::')
  const h = head ? head.split(':') : []
  const t = tail ? tail.split(':') : []
  const groups = ip.includes('::') ? [...h, ...Array<string>(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h
  return `${groups
    .slice(0, 4)
    .map((g) => g.toLowerCase().replace(/^0+(?=.)/, ''))
    .join(':')}::/64`
}

/**
 * Suma un intento al bucket de la IP y dice si superó el límite. Solo con base configurada: en
 * modo memoria (local/test) no limita. Si la consulta falla, deja pasar y lo loguea (fail-open):
 * perder un lead legítimo por una caída del contador es peor que dejar pasar spam un rato.
 */
export async function hitRateLimit(
  request: Request,
  { scope, max, windowSeconds }: { scope: string; max: number; windowSeconds: number },
): Promise<RateLimitResult> {
  if (!isDatabaseConfigured()) return { limited: false }
  const bucket = createHash('sha256')
    .update(`${scope}:${ipPrefix(clientIp(request))}:${process.env.IP_HASH_SALT ?? ''}`)
    .digest('hex')
  try {
    const [row] = await getPrisma().$queryRaw<{ hits: number; window_start: Date }[]>`
      INSERT INTO rate_limits (bucket, window_start, hits) VALUES (${bucket}, now(), 1)
      ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE WHEN rate_limits.window_start < now() - ${windowSeconds}::int * interval '1 second'
                    THEN 1 ELSE rate_limits.hits + 1 END,
        window_start = CASE WHEN rate_limits.window_start < now() - ${windowSeconds}::int * interval '1 second'
                            THEN now() ELSE rate_limits.window_start END
      RETURNING hits, window_start`
    if (!row || Number(row.hits) <= max) return { limited: false }
    const resetAt = new Date(row.window_start).getTime() + windowSeconds * 1000
    return { limited: true, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)) }
  } catch (err) {
    logEvent('ratelimit.error', { scope, code: (err as { code?: string } | null)?.code ?? 'unknown' })
    return { limited: false }
  }
}
