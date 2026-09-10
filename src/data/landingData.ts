import type {
  CoordinateAxis,
  FooterCertification,
  FooterContactItem,
  FooterLinkGroup,
  GalleryCard,
  MicroCheck,
  NavLink,
  PolymerShrinkage,
  ProductionCycleCard,
  TechnicalMetric,
  TelemetryReadout,
  WorkflowStep,
} from '@/types/landing'

export const WHATSAPP_NUMBER = '5491149823301'

export const NAV_LINKS: NavLink[] = [
  { id: 'servicios', label: 'Servicios', href: '/#servicios' },
  { id: 'materiales-y-contracciones', label: 'Materiales y Contracciones', href: '/#materiales-y-contracciones' },
  { id: 'galeria-cnc', label: 'Galería CNC', href: '/#galeria-cnc' },
  { id: 'proceso', label: 'Proceso', href: '/#proceso' },
  { id: 'especificaciones', label: 'Especificaciones', href: '/#cotizacion' },
]

export const HERO_CONTENT = {
  statusTag: '// INGENIERÍA Y MECANIZADO CNC // ALUMINIO 7075-T6 / 6061',
  title: 'Matricería CNC y Grabado de Alta Precisión en Aluminio para Calzado',
  description:
    'Desde el modelado 3D CAD/CAM hasta el molde montado, probado y listo para inyección continua en planta. Tolerancias micrométricas y texturas complejas para la industria del calzado moderno.',
  primaryCta: { label: 'SOLICITAR COTIZACIÓN TÉCNICA', href: '/cotizador-tecnico', icon: 'precision_manufacturing' },
  secondaryCta: { label: 'VER CATÁLOGO DE TRABAJOS', href: '#galeria-cnc', icon: 'grid_view' },
  whatsappCta: { label: '[ HABLAR CON INGENIERO POR WHATSAPP ]', icon: 'chat' },
}

export const HERO_MICRO_CHECKS: MicroCheck[] = [
  { id: 'tiempos-record', icon: 'speed', label: 'Tiempos récord' },
  { id: 'cero-rebaba', icon: 'verified', label: 'Ajuste cero rebaba' },
  { id: 'atencion-modelistas', icon: 'engineering', label: 'Atención modelistas' },
]

export const TELEMETRY_HEADER = {
  viewportLabel: 'VIEWPORT: CNC_AXIS_CAM_01',
  materialTag: '// 7075-T6 BILLET',
  frameRate: 'FRAME: 144.2 FPS',
  image: '/assets/images/hero-cnc-mecanizado-hud.jpg',
  imageAlt:
    'Mecanizado CNC de alta velocidad fresando matriz de suela de calzado en bloque de duraluminio con líquido refrigerante activo',
}

export const TELEMETRY_TOP_READOUTS: TelemetryReadout[] = [
  { id: 'spindle', label: 'SPINDLE:', value: '24,000 RPM', emphasis: false },
  { id: 'potencia', label: 'POTENCIA:', value: '18.5 kW', emphasis: true },
]

export const TELEMETRY_FEED_READOUT: TelemetryReadout = {
  id: 'avance',
  label: 'AVANCE FRESADO:',
  value: '1,850 mm/min',
}

export const TELEMETRY_COORDINATES: CoordinateAxis[] = [
  { id: 'tele-x', axis: 'X', base: 284.192 },
  { id: 'tele-y', axis: 'Y', base: 112.54 },
  { id: 'tele-z', axis: 'Z', base: -14.285, emphasis: true },
]

export const TELEMETRY_STATUS = {
  coolingLabel: 'REFRIGERACIÓN: NIEBLA MQL ACTIVA',
  statusLabel: 'STATUS:',
  statusValue: 'NOMINAL // EN TOLERANCIA',
  calibrationLabel: 'CALIBRACIÓN ÓPTICA MITUTOYO',
  toleranceLabel: 'TOLERANCIA ACTIVA: ±0.035 mm',
}

export const TECHNICAL_METRICS: TechnicalMetric[] = [
  {
    id: 'precision-dimensional',
    label: 'PRECISIÓN DIMENSIONAL',
    icon: 'straighten',
    value: '±0.05 mm',
    detail: 'Acabado superficial espejo Ra 0.4',
  },
  {
    id: 'formatos-cad',
    label: 'FORMATOS CAD NATIVOS',
    icon: 'folder_zip',
    value: '.STEP / .STL',
    detail: 'Compatibilidad IGES, DXF y OBJ',
  },
  {
    id: 'entorno-cad-cam',
    label: 'ENTORNO CAD/CAM',
    icon: 'laptop_chromebook',
    value: 'Rhino 3D & CAM',
    detail: 'ArtCAM, JewelSmith & PowerMill',
  },
  {
    id: 'cobertura-integral',
    label: 'COBERTURA INTEGRAL',
    icon: 'cached',
    value: '360° En Planta',
    detail: 'Modelado, matricería, prueba e inyección',
  },
]

export const PRODUCTION_CYCLE_SECTION = {
  tag: '// MÓDULO DE INGENIERÍA Y FABRICACIÓN',
  title: 'Ciclo Integral de Producción',
  badge: 'NORMAS ISO 9001:2015 // CONTROL 5-AXIS',
}

export const PRODUCTION_CYCLE_CARDS: ProductionCycleCard[] = [
  {
    id: 'cad-cam',
    code: '01 // CAD-CAM',
    tag: '[ALGORITMO]',
    title: 'Ingeniería 3D y CAD/CAM',
    description:
      'Modelado paramétrico de huellas, graduación computarizada de talles punto por punto y cálculo de contracciones poliméricas precisas según el material de inyección.',
    statusLabel: 'STATUS:',
    statusValue: 'Curvatura dinámica OK',
  },
  {
    id: 'matriceria',
    code: '02 // MATRICERÍA',
    tag: '[MECANIZADO 5-EJES]',
    title: 'Fabricación de Moldes Completos',
    description:
      'Mecanizado integral de placas, portamoldes estándar y especiales, líneas de partición selladas, sistemas de expulsión y ajustes en banco de ajuste.',
    statusLabel: 'TOLERANCIA:',
    statusValue: 'Cierre estanco sin rebaba',
  },
  {
    id: 'grabado-3d',
    code: '03 // GRABADO 3D',
    tag: '[MICROFRESA 0.2mm]',
    title: 'Grabado y Texturizado 3D',
    description:
      'Grabado de logotipos microdefinidos, numeración de talle, texturas geométricas profundas y patrones antiderrapantes directamente en router CNC de precisión.',
    statusLabel: 'RESOLUCIÓN:',
    statusValue: 'Radio hasta 0.20 mm',
  },
  {
    id: 'mantenimiento',
    code: '04 // MANTENIMIENTO',
    tag: '[GUARDIA 24-48H]',
    title: 'Reparación y Puesta a Punto',
    description:
      'Eliminación de rebabas por fatiga de molde, cambio y fresado de insertos de marca, rectificado de planos y rescate urgente de matrices dañadas en línea.',
    statusLabel: 'RESPUESTA:',
    statusValue: 'Mecanizado express',
  },
]

export const MATERIALS_SECTION = {
  tag: '// TERMODINÁMICA Y POLÍMEROS',
  title: 'Física Aplicada al Molde: Contracciones & Dilatación',
  paragraphs: [
    'Cada compuesto termoplástico o termoestable experimenta una reducción volumétrica crítica durante la transición vítrea y solidificación. Fabricar un molde con escala 1:1 resulta invariablemente en una suela fuera de calce y deformación en puntera.',
  ],
  highlight: {
    icon: 'tune',
    title: 'Compensación no lineal en CAD',
    description:
      'Ajustamos diferentes factores en talón, enfranque y suelín según la densidad del espesor de pared.',
  },
  tableLabel: 'TABLA DE CONTRACCIÓN POLIMÉRICA TÉCNICA',
  tableBadge: 'BASE DURAL 7075 // 20°C',
}

export const POLYMER_SHRINKAGE_TABLE: PolymerShrinkage[] = [
  {
    id: 'pvc',
    name: 'PVC',
    formula: '(Policloruro de Vinilo)',
    rangeLabel: '1.2% - 2.0%',
    barWidthPct: 38,
    barVariant: 'default',
    note: 'Compuestos compactos de piso y expandidos estándar.',
  },
  {
    id: 'tr',
    name: 'TR',
    formula: '(Termo-Caucho SBS / SEBS)',
    rangeLabel: '1.5% - 2.2%',
    barWidthPct: 44,
    barVariant: 'default',
    note: 'Excelente memoria elástica, requiere compensación angular en cantos vivos.',
  },
  {
    id: 'pu',
    name: 'PU',
    formula: '(Poliuretano Bidensidad)',
    rangeLabel: '1.0% - 1.4%',
    barWidthPct: 28,
    barVariant: 'default',
    note: 'Baja contracción volumétrica con estricto control de presión de inyección.',
  },
  {
    id: 'eva',
    name: 'EVA',
    formula: '(Etilvinilacetato Reticulado)',
    rangeLabel: 'EXP. DINÁMICA (-35% a +60%)',
    barWidthPct: 85,
    barVariant: 'nominal',
    note: 'Expansión al abrir molde y contracción térmica secundaria post-estabilización.',
  },
  {
    id: 'rubber',
    name: 'RUBBER',
    formula: '(Caucho Vulcanizado SBR)',
    rangeLabel: '2.5% - 3.2%',
    barWidthPct: 64,
    barVariant: 'default',
    note: 'Prensado a alta temperatura (160°C). Mayor compensación de eje longitudinal.',
  },
]

export const GALLERY_SECTION = {
  tag: '// BANCO DE INSPECCIÓN VISUAL Y ACABADOS',
  title: 'Galería de Mecanizados Macro',
  badge: 'RESOLUCIÓN SUPERFICIAL RA: 0.40 - 0.80 µm',
}

export const GALLERY_CARDS: GalleryCard[] = [
  {
    id: 'moldes-armados',
    code: 'COD: #MOD-7075-ASSY',
    title: 'Moldes de Inyección Armados',
    description:
      'Bloque aluminio dural 7075 con bujes templados, columnas guía y portamoldes de acero rectificado para prensas de alta presión continua.',
    specLabel: 'AJUSTE:',
    specValue: 'Tolerancia H7 / g6',
    image: '/assets/images/mold-injection-block-7075.jpg',
    alt: 'Macro close-up shot of a heavy-duty industrial shoe sole injection mold milled from aircraft-grade 7075-T6 aluminum block, showing precision parting lines, guide pins, and stainless steel fasteners with high mechanical contrast in dark industrial lighting.',
  },
  {
    id: 'texturas-3d',
    code: 'COD: #TXT-MICRO-HEX',
    title: 'Texturas y Pisadas 3D Profundas',
    description:
      'Fresado 5 ejes con microfresas esféricas de 0.4 mm para huellas de máximo agarre técnico, estrías romboidales y estrías antiderrapantes.',
    specLabel: 'PASADA CAM:',
    specValue: 'Stepover 0.04 mm',
    image: '/assets/images/mold-tread-mountain-boot.jpg',
    alt: 'Extreme macro technical photography of an aggressive mountain boot tread mold cavity milled in billet aluminum, featuring geometric micro-grooves, knurling textures, and sharp grip studs with glistening cutting coolant droplets under cold machine lights.',
  },
  {
    id: 'grabado-logo',
    code: 'COD: #ENG-LOGO-ZERO-FLASH',
    title: 'Grabados de Logotipo Sin Rebaba',
    description:
      'Tolerancia micrométrica en bordes de partición para evitar repasado manual en producción masiva. Letras y vectores con ángulo de desmolde óptimo.',
    specLabel: 'ÁNGULO SALIDA:',
    specValue: '3° a 5° Cónico',
    image: '/assets/images/mold-brand-logo-engraved.jpg',
    alt: 'High precision macro photo of footwear brand logo engraved into polished aluminum mold cavity, showing razor-sharp crisp edges, zero burrs, metallic tool marks, and calibrated depth markings in technical lighting.',
  },
]

export const WORKFLOW_SECTION = {
  tag: '// METODOLOGÍA INDUSTRIAL PASO A PASO',
  title: 'Flujo de Trabajo Certificado',
  badge: 'TRAZABILIDAD DE PIEZA DE PUNTA A PUNTA',
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'recepcion',
    number: '01',
    icon: 'upload_file',
    title: 'Recepción de Archivo o Muestra',
    description:
      'Validación de planos CAD 3D (.STEP/.IGES) o digitalización tridimensional mediante palpador y escáner óptico de suelas físicas existentes.',
    tag: '// CHEQUEO TOPOLÓGICO CAD',
  },
  {
    id: 'simulacion',
    number: '02',
    icon: 'architecture',
    title: 'Simulación CAM y Virtual Cut',
    description:
      'Generación de trayectorias en ArtCAM/Rhino, compensación diferencial de contracción polimérica y simulación anticolisión 5 ejes.',
    tag: '// POST-PROCESADO G-CODE',
  },
  {
    id: 'mecanizado',
    number: '03',
    icon: 'precision_manufacturing',
    title: 'Mecanizado y Texturizado CNC',
    description:
      'Desbaste de alta velocidad en centro de mecanizado vertical, pasadas de afinado a 24,000 RPM y grabado de microtextura con herramientas de diamante.',
    tag: '// DURAL 7075-T6 BILLET',
  },
  {
    id: 'entrega',
    number: '04',
    icon: 'verified_user',
    title: 'Ajuste en Banco y Entrega',
    description:
      'Verificación dimensional con calibres Mitutoyo, prueba de cierre estanco con azul de Prusia para garantizar cero rebaba, y despacho rápido a planta.',
    tag: '// CERTIFICADO FINAL OK',
  },
]

export const CTA_BANNER_CONTENT = {
  statusLabel: 'OFICINA TÉCNICA Y RECEPCIÓN CAD DISPONIBLE 24H',
  title: '¿Tienes una nueva temporada o un molde por reparar?',
  description:
    'Envíanos tus archivos 3D (.STEP, .IGES, .STL) o coordina el retiro de tu muestra física. Emitimos respuesta técnica y presupuesto en menos de 24 horas hábiles.',
  cta: { label: 'COTIZAR', icon: 'precision_manufacturing', to: '/cotizador-tecnico' },
  guarantees: [
    { id: 'atencion-directa', icon: 'support_agent', label: 'Atención técnica directa con ingenieros de mecanizado' },
    { id: 'nda', icon: 'lock', label: 'Acuerdos de confidencialidad NDA garantizados' },
  ],
}

export const FOOTER_BRAND = {
  name: 'LACERS',
  certificationBadge: 'ISO 9001:2015',
  description:
    'Ingeniería de matrices de inyección y compresión en aleaciones de duraluminio 7075-T6 y fundición naval. Tolerancias mecánicas micrométricas para la industria global del calzado técnico y deportivo.',
  toleranceLabel: 'TOLERANCIA DIN EN ISO 2768-mH',
}

export const FOOTER_LINK_GROUPS: FooterLinkGroup[] = [
  {
    id: 'soluciones',
    title: 'Soluciones & Mecanizado',
    links: [
      { id: 'l1', label: 'Moldes de Inyección Directa al Corte', href: '/#servicios' },
      { id: 'l2', label: 'Matrices Monocolor y Bicolor', href: '/#servicios' },
      { id: 'l3', label: 'Grabado Láser y Texturizado CNC 3D', href: '/#servicios' },
      { id: 'l4', label: 'Digitalización CAD y Escaneo Óptico', href: '/cotizador-tecnico' },
      { id: 'l5', label: 'Prototipado Rápido en Billet 6061', href: '/#proceso' },
    ],
  },
  {
    id: 'polimeros',
    title: 'Polímeros & Contracciones',
    links: [
      { id: 'p1', label: 'EVA Expandida / Reticulada (Contr. Var.)', href: '/#materiales-y-contracciones' },
      { id: 'p2', label: 'Poliuretano Bidensidad (PU / TPU)', href: '/#materiales-y-contracciones' },
      { id: 'p3', label: 'Caucho Vulcanizado & Sintético (SBR)', href: '/#materiales-y-contracciones' },
      { id: 'p4', label: 'Termoplásticos TR y PVC Compacto', href: '/#materiales-y-contracciones' },
      { id: 'p5', label: 'Pebax & Compuestos de Alto Rebote', href: '/#materiales-y-contracciones' },
    ],
  },
]

export const FOOTER_CONTACT_ITEMS: FooterContactItem[] = [
  { id: 'planta', icon: 'precision_manufacturing', label: 'Parque Industrial Metalmecánico Nave 04-B' },
  { id: 'email', icon: 'mail', label: 'ingenieria@lacers-cnc.com' },
  { id: 'whatsapp', icon: 'chat', label: 'WhatsApp Técnico: +54 9 11 4982-3301' },
]

export const FOOTER_SHIFT_LABEL = 'TURNO MAQUINADO: 24/7 ACTIVO'

export const FOOTER_LEGAL = '© 2024 LACERS MATRICERÍA INDUSTRIAL S.R.L. // TODOS LOS DERECHOS RESERVADOS.'

export const FOOTER_CERTIFICATIONS: FooterCertification[] = [
  { id: 'iso9001', label: 'CALIDAD CERTIFICADA ISO 9001' },
  { id: 'ce', label: 'NORMATIVA DE SEGURIDAD CE' },
  { id: 'cad', label: 'ESPECIFICACIÓN CAD CAM STEP/IGES' },
]
