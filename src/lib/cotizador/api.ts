// Contrato HTTP de /api (ADR-0006). Sin Zod: lo importan la SPA y el panel admin sin sumar peso.

export const QUOTE_STATUSES = ['nueva', 'en_revision', 'cotizada', 'cerrada', 'descartada'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

/** Dónde quedó guardada la solicitud: Neon, o memoria del proceso en local/test (sin DATABASE_URL). */
export type QuoteStorage = 'database' | 'memory'

/** Respuesta 200/201 de POST /api/quotes. */
export interface QuoteCreatedResponse {
  publicCode: string
  projectCode: string
  pairs: number
  shrinkagePct: number
  specialReasons: string[]
  createdAt: string
  storage: QuoteStorage
}

/** Fila del listado de GET /api/admin/quotes (incluye contacto: solo admin). */
export interface AdminQuoteRow {
  id: string
  publicCode: string
  projectCode: string
  status: QuoteStatus
  processId: string
  alloyId: string | null
  polymerId: string
  geometryMode: 'cad' | 'muestra'
  sizeStart: number
  sizeEnd: number
  pairs: number
  shrinkagePct: number
  note: string | null
  contactName: string
  contactCompany: string | null
  contactEmail: string | null
  contactPhone: string | null
  isSpecialCase: boolean
  specialReasons: string[]
  isSpam: boolean
  createdAt: string
  statusChangedAt: string
}

export interface AdminQuotesResponse {
  items: AdminQuoteRow[]
  storage: QuoteStorage
}

/** Forma única de error de la API (ADR-0006). */
export interface ApiErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> }
}
