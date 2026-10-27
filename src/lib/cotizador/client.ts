import type { ApiErrorBody, QuoteCreatedResponse } from './api'
import type { QuoteRequestInput } from './schema'

// Cliente HTTP del wizard para POST /api/quotes (ADR-0011: timeout de 20 s y errores tipados).

const TIMEOUT_MS = 20_000

export type SubmitQuoteResult =
  | { ok: true; quote: QuoteCreatedResponse }
  | { ok: false; kind: 'validation'; message: string; fields: Record<string, string> }
  | { ok: false; kind: 'key_reused'; message: string; publicCode?: string }
  | { ok: false; kind: 'unavailable'; message: string }

export async function submitQuote(input: QuoteRequestInput, idempotencyKey: string): Promise<SubmitQuoteResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
    const body = (await response.json().catch(() => null)) as QuoteCreatedResponse | ApiErrorBody | null

    if (response.ok && body && 'publicCode' in body) return { ok: true, quote: body }

    const error = body && 'error' in body ? body.error : null
    if (response.status === 400 && error) {
      return { ok: false, kind: 'validation', message: error.message, fields: error.fields ?? {} }
    }
    if (response.status === 409 && error) {
      return { ok: false, kind: 'key_reused', message: error.message, publicCode: error.fields?.publicCode }
    }
    return {
      ok: false,
      kind: 'unavailable',
      message: error?.message ?? 'El servicio de cotizaciones no está disponible en este momento.',
    }
  } catch {
    return { ok: false, kind: 'unavailable', message: 'No pudimos conectar con el servidor. Revisá tu conexión y reintentá.' }
  } finally {
    clearTimeout(timer)
  }
}
