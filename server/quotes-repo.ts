import { buildPublicCode, CALC_VERSION, type QuoteEstimate } from '../src/lib/cotizador/calc.js'
import type { AdminQuoteRow, QuoteStatus, QuoteStorage } from '../src/lib/cotizador/api.js'
import type { QuoteRequestData } from '../src/lib/cotizador/schema.js'
import { getPrisma, isDatabaseConfigured, isMemoryFallbackAllowed } from './neon.js'
import type { QuoteRequest } from './generated/prisma/client.js'

export interface NewQuote {
  submissionKey: string
  payloadHash: string
  data: QuoteRequestData
  estimate: QuoteEstimate
  isSpam: boolean
}

export interface StoredQuote extends AdminQuoteRow {
  payloadHash: string
}

export interface ListFilter {
  status?: QuoteStatus
  q?: string
  includeSpam: boolean
  limit: number
}

export interface QuotesRepo {
  storage: QuoteStorage
  findBySubmissionKey(key: string): Promise<StoredQuote | null>
  /** Devuelve null si otra request ya insertó la misma submissionKey (carrera). */
  create(quote: NewQuote): Promise<StoredQuote | null>
  list(filter: ListFilter): Promise<StoredQuote[]>
}

/** null = no hay base configurada y el fallback en memoria no está permitido (producción). */
export function getQuotesRepo(): QuotesRepo | null {
  if (isDatabaseConfigured()) return prismaRepo
  if (isMemoryFallbackAllowed()) return memoryRepo
  return null
}

// ── Prisma / Neon ────────────────────────────────────────────────────────────

function toRow(q: QuoteRequest): StoredQuote {
  return {
    id: q.id,
    publicCode: q.publicCode ?? q.projectCode,
    projectCode: q.projectCode,
    status: q.status,
    processId: q.processId,
    alloyId: q.alloyId,
    polymerId: q.polymerId,
    geometryMode: q.geometryMode,
    sizeStart: q.sizeStart,
    sizeEnd: q.sizeEnd,
    pairs: q.pairs,
    shrinkagePct: Number(q.shrinkagePct),
    note: q.note,
    contactName: q.contactName,
    contactCompany: q.contactCompany,
    contactEmail: q.contactEmail,
    contactPhone: q.contactPhone,
    isSpecialCase: q.isSpecialCase,
    specialReasons: q.specialReasons,
    isSpam: q.isSpam,
    createdAt: q.createdAt.toISOString(),
    statusChangedAt: q.statusChangedAt.toISOString(),
    payloadHash: q.payloadHash,
  }
}

const isUniqueViolation = (err: unknown) => (err as { code?: string } | null)?.code === 'P2002'

const prismaRepo: QuotesRepo = {
  storage: 'database',

  async findBySubmissionKey(key) {
    const row = await getPrisma().quoteRequest.findUnique({ where: { submissionKey: key } })
    return row ? toRow(row) : null
  },

  async create({ submissionKey, payloadHash, data, estimate, isSpam }) {
    try {
      // INSERT + UPDATE del public_code en una transacción: el folio lo asigna Postgres.
      const row = await getPrisma().$transaction(async (tx) => {
        const created = await tx.quoteRequest.create({
          data: {
            submissionKey,
            payloadHash,
            projectCode: estimate.projectCode,
            processId: data.processId,
            alloyId: data.alloyId,
            polymerId: data.polymerId,
            geometryMode: data.geometryMode,
            sizeStart: data.sizeStart,
            sizeEnd: data.sizeEnd,
            pairs: estimate.pairs,
            note: data.note ?? null,
            contactName: data.contact.name,
            contactCompany: data.contact.company ?? null,
            contactEmail: data.contact.email ?? null,
            contactPhone: data.contact.phone ?? null,
            privacyAcceptedAt: new Date(),
            shrinkagePct: estimate.shrinkagePct,
            calcVersion: CALC_VERSION,
            isSpecialCase: estimate.specialReasons.length > 0,
            specialReasons: estimate.specialReasons,
            isSpam,
          },
        })
        return tx.quoteRequest.update({
          where: { id: created.id },
          data: { publicCode: buildPublicCode(created.projectCode, created.folio) },
        })
      })
      return toRow(row)
    } catch (err) {
      if (isUniqueViolation(err)) return null
      throw err
    }
  },

  async list({ status, q, includeSpam, limit }) {
    const search = q?.trim()
    const folio = search && /^\d+$/.test(search) ? Number(search) : undefined
    const rows = await getPrisma().quoteRequest.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(includeSpam ? {} : { isSpam: false }),
        ...(search
          ? {
              OR: [
                { publicCode: { contains: search.toUpperCase() } },
                ...(folio !== undefined && folio <= 2_147_483_647 ? [{ folio }] : []),
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return rows.map(toRow)
  },
}

// ── Memoria (solo local/test sin DATABASE_URL) ──────────────────────────────

const memory: StoredQuote[] = []

const memoryRepo: QuotesRepo = {
  storage: 'memory',

  async findBySubmissionKey(key) {
    return memory.find((q) => q.id === key) ?? null
  },

  async create({ submissionKey, payloadHash, data, estimate, isSpam }) {
    if (memory.some((q) => q.id === submissionKey)) return null
    const now = new Date().toISOString()
    const row: StoredQuote = {
      // En memoria el id coincide con la submissionKey para simplificar el replay.
      id: submissionKey,
      publicCode: buildPublicCode(estimate.projectCode, memory.length + 1),
      projectCode: estimate.projectCode,
      status: 'nueva',
      processId: data.processId,
      alloyId: data.alloyId,
      polymerId: data.polymerId,
      geometryMode: data.geometryMode,
      sizeStart: data.sizeStart,
      sizeEnd: data.sizeEnd,
      pairs: estimate.pairs,
      shrinkagePct: estimate.shrinkagePct,
      note: data.note ?? null,
      contactName: data.contact.name,
      contactCompany: data.contact.company ?? null,
      contactEmail: data.contact.email ?? null,
      contactPhone: data.contact.phone ?? null,
      isSpecialCase: estimate.specialReasons.length > 0,
      specialReasons: estimate.specialReasons,
      isSpam,
      createdAt: now,
      statusChangedAt: now,
      payloadHash,
    }
    memory.push(row)
    return row
  },

  async list({ status, q, includeSpam, limit }) {
    const search = q?.trim().toUpperCase()
    return memory
      .filter((row) => (!status || row.status === status) && (includeSpam || !row.isSpam))
      .filter((row) => !search || row.publicCode.includes(search))
      .slice()
      .reverse()
      .slice(0, limit)
  },
}
