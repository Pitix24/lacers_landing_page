import { CNC_ALLOYS, CNC_POLYMERS, CNC_PROCESSES } from '../../data/landingData.js'
import type { QuoteRequestData } from './schema.js'

/** Versión del cálculo persistida con cada solicitud; subirla si cambian las reglas. */
export const CALC_VERSION = 'v1-2026-10'

/** Token del código de proyecto cuando la aleación se verifica en banco (ADR-0005). */
export const ALLOY_TO_VERIFY = 'VRF'

export const LARGE_RUN_PAIRS = 30

export interface QuoteEstimate {
  pairs: number
  projectCode: string
  shrinkagePct: number
  specialReasons: string[]
}

/** Valores derivados de la solicitud. El servidor los recalcula siempre; nunca confía en el cliente. */
export function calcularEstimacion(input: Pick<QuoteRequestData, 'processId' | 'alloyId' | 'polymerId' | 'sizeStart' | 'sizeEnd'>): QuoteEstimate {
  const process = CNC_PROCESSES.find((p) => p.id === input.processId)
  const alloy = input.alloyId ? CNC_ALLOYS.find((a) => a.id === input.alloyId) : undefined
  const polymer = CNC_POLYMERS.find((p) => p.id === input.polymerId)
  const pairs = input.sizeEnd - input.sizeStart + 1

  const specialReasons: string[] = []
  if (pairs > LARGE_RUN_PAIRS) specialReasons.push('pairs_gt_30')
  if (polymer?.isExpansive) specialReasons.push('polymer_expansive')

  return {
    pairs,
    projectCode: `REQ-${alloy?.code ?? ALLOY_TO_VERIFY}-${process?.code ?? 'XX'}${String(pairs).padStart(2, '0')}`,
    shrinkagePct: polymer?.shrinkagePct ?? 0,
    specialReasons,
  }
}

/** Código público: projectCode + folio de 6 dígitos (REQ-7075-MC08-000123). */
export function buildPublicCode(projectCode: string, folio: number): string {
  return `${projectCode}-${String(folio).padStart(6, '0')}`
}
