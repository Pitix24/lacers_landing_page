import { createHash, timingSafeEqual } from 'node:crypto'
import type { ApiErrorBody } from '../src/lib/cotizador/api.js'

export const MAX_BODY_BYTES = 16 * 1024

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

export function apiError(status: number, code: string, message: string, fields?: Record<string, string>): Response {
  const body: ApiErrorBody = { error: { code, message, ...(fields ? { fields } : {}) } }
  return json(body, status, { 'Cache-Control': 'no-store' })
}

/** Lee el body como JSON respetando el límite de 16 kB (ADR-0006). */
export async function readJsonBody(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return { ok: false, response: apiError(413, 'PAYLOAD_TOO_LARGE', 'El cuerpo supera los 16 kB.') }
  }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false, response: apiError(400, 'INVALID_JSON', 'El cuerpo no es JSON válido.') }
  }
}

/** sha256 del valor con claves ordenadas: mismo payload ⇒ mismo hash (ADR-0009). */
export function canonicalHash(value: unknown): string {
  const canonical = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(canonical)
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.keys(v as Record<string, unknown>)
          .sort()
          .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
          .map((k) => [k, canonical((v as Record<string, unknown>)[k])]),
      )
    }
    return v
  }
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
}

/**
 * Auth provisoria del panel: `Authorization: Bearer <ADMIN_TOKEN>` comparado en tiempo
 * constante. La spec-04 la reemplaza por login + cookie firmada (ADR-0008).
 */
export function requireAdmin(request: Request): Response | null {
  const expected = process.env.ADMIN_TOKEN
  if (!expected || expected.length < 24) {
    return apiError(503, 'ADMIN_NOT_CONFIGURED', 'ADMIN_TOKEN no está configurado en el servidor (mínimo 24 caracteres).')
  }
  const header = request.headers.get('authorization') ?? ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : ''
  const digest = (s: string) => createHash('sha256').update(s).digest()
  if (!provided || !timingSafeEqual(digest(provided), digest(expected))) {
    return apiError(401, 'UNAUTHORIZED', 'Sesión de admin inválida.')
  }
  return null
}

/** Log JSON sin PII (config.yaml: no loguear email, teléfono ni nombre). */
export function logEvent(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ event, at: new Date().toISOString(), ...data }))
}
