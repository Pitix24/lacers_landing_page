/** Nombre de un icono de la fuente Material Symbols Outlined (ej. "precision_manufacturing"). */
export type MaterialIconName = string

export interface NavLink {
  id: string
  label: string
  href: string
}

export interface MicroCheck {
  id: string
  icon: MaterialIconName
  label: string
}

export interface TelemetryReadout {
  id: string
  label: string
  value: string
  emphasis?: boolean
}

export interface CoordinateAxis {
  id: string
  axis: 'X' | 'Y' | 'Z'
  base: number
  emphasis?: boolean
}

export interface TechnicalMetric {
  id: string
  label: string
  icon: MaterialIconName
  value: string
  detail: string
}

export interface ProductionCycleCard {
  id: string
  code: string
  tag: string
  title: string
  description: string
  statusLabel: string
  statusValue: string
}

export interface PolymerShrinkage {
  id: string
  name: string
  formula: string
  rangeLabel: string
  barWidthPct: number
  barVariant: 'default' | 'nominal'
  note: string
}

export interface GalleryCard {
  id: string
  code: string
  title: string
  description: string
  specLabel: string
  specValue: string
  image: string
  alt: string
}

export interface WorkflowStep {
  id: string
  number: string
  icon: MaterialIconName
  title: string
  description: string
  tag: string
}

export interface FooterLink {
  id: string
  label: string
  href: string
}

export interface FooterLinkGroup {
  id: string
  title: string
  links: FooterLink[]
}

export interface FooterContactItem {
  id: string
  icon: MaterialIconName
  label: string
}

export interface FooterCertification {
  id: string
  label: string
}

/** Aleación de bloque/placa ofrecida en el Cotizador Técnico. */
export interface CncAlloy {
  id: string
  /** Serie sin temple; se usa en el código de proyecto (REQ-<code>-…). */
  code: string
  label: string
  note: string
}

/** Tipo de requerimiento / proceso de mecanizado del paso 01 del Cotizador Técnico. */
export interface CncProcess {
  id: string
  /** Sigla de 2 letras; se usa en el código de proyecto. */
  code: string
  label: string
  icon: MaterialIconName
  description: string
  tag: string
  tolerance: string
  machine: string
  /** Aleación preseleccionada; si se omite, la aleación se verifica en banco de ajuste. */
  defaultAlloyId?: string
}
