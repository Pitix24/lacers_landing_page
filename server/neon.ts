import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from './generated/prisma/client.js'

// Cliente Prisma sobre Neon (ADR-0014). Solo servidor: DATABASE_URL nunca llega al bundle
// del frontend (no usa prefijo VITE_ y este módulo solo lo importan api/ y server/).

let client: PrismaClient | undefined

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

/**
 * Fallback seguro: sin DATABASE_URL solo se permite el almacenamiento en memoria fuera de
 * producción (vite dev, tests). En Vercel (NODE_ENV=production) la API responde 503.
 */
export function isMemoryFallbackAllowed(): boolean {
  return !isDatabaseConfigured() && process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1'
}

/** Instancia única por proceso: Fluid Compute reutiliza la instancia entre requests. */
export function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL no está configurada')
  client ??= new PrismaClient({ adapter: new PrismaNeon({ connectionString }) })
  return client
}
