import type { FullConfig } from '@playwright/test'

/**
 * Guard: el E2E envía solicitudes reales a POST /api/quotes. Si el dev server reutilizado
 * tiene DATABASE_URL cargada, las escribiría en Neon; en ese caso se aborta la corrida.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL
  const response = await fetch(`${baseURL}/api/health`)
  const body = (await response.json().catch(() => null)) as { storage?: string } | null
  if (body?.storage !== 'memory') {
    throw new Error(
      `El dev server en ${baseURL} no está en modo memoria (storage=${body?.storage ?? 'desconocido'}). ` +
        'Cortá el server con DATABASE_URL o levantalo sin ella antes de correr los E2E.',
    )
  }
}
