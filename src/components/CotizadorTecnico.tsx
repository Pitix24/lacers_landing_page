import { useRef, useState } from 'react'
import { CNC_ALLOYS, CNC_POLYMERS, CNC_PROCESSES, DEFAULT_CNC_ALLOY_ID, WHATSAPP_NUMBER } from '@/data/landingData'
import { ALLOY_TO_VERIFY } from '@/lib/cotizador/calc'
import { submitQuote, type SubmitQuoteResult } from '@/lib/cotizador/client'
import type { QuoteCreatedResponse } from '@/lib/cotizador/api'
import type { QuoteRequestInput } from '@/lib/cotizador/schema'
import MaterialIcon from '@/components/common/MaterialIcon'
import SectionHeading from '@/components/common/SectionHeading'
import StatusPulseDot from '@/components/common/StatusPulseDot'

type GeoMode = 'cad' | 'muestra'

type SubmitState =
  | { phase: 'idle' }
  | { phase: 'sending' }
  | { phase: 'done'; quote: QuoteCreatedResponse }
  | { phase: 'error'; result: Exclude<SubmitQuoteResult, { ok: true }> }

const inputClass =
  'w-full rounded-sm border border-metal bg-canvas px-3.5 py-3 font-mono text-sm text-main outline-none focus:border-accent-red'

const formatShrink = (pct: number) => `${pct.toFixed(1)}%`

/** Error de un campo devuelto por la API (400 VALIDATION_ERROR). */
function FieldError({ message }: { message?: string }) {
  return message ? <span className="font-mono text-[10px] tracking-wide text-accent-red-light">{message}</span> : null
}

/** Panel de estado "chip" reutilizado en cada paso del wizard (pendiente / en configuración / completo). */
function StepStatus({ done, active }: { done: boolean; active: boolean }) {
  const label = done ? 'COMPLETO' : active ? 'EN CONFIGURACIÓN' : 'PENDIENTE'
  const color = done ? 'text-accent-green' : active ? 'text-accent-red' : 'text-metal-deep'
  return <span className={`font-mono text-[11px] uppercase tracking-widest ${color}`}>{label}</span>
}

/**
 * Wizard de cotización técnica (portado desde el canvas de diseño "Cotizador Técnico").
 * El bloque de input de geometría (paso 03) es intencionalmente un placeholder visual:
 * no adjunta archivos ni fotos reales y no condiciona el resto del flujo.
 */
export default function CotizadorTecnico() {
  const [type, setType] = useState<string | null>(null)
  const [alloyId, setAlloyId] = useState<string | null>(null)
  const [polymer, setPolymer] = useState<string | null>(null)
  const [geoMode, setGeoMode] = useState<GeoMode>('cad')
  const [sizeStart, setSizeStart] = useState('36')
  const [sizeEnd, setSizeEnd] = useState('43')
  const [note, setNote] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactCompany, setContactCompany] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [website, setWebsite] = useState('')
  const [submit, setSubmit] = useState<SubmitState>({ phase: 'idle' })
  // Idempotency-Key (ADR-0009): se genera al enviar y se reutiliza mientras el payload no cambie.
  const submission = useRef<{ key: string; payload: string } | null>(null)

  const start = Number(sizeStart) || 0
  const end = Number(sizeEnd) || 0
  const pares = end >= start && sizeStart !== '' && sizeEnd !== '' ? end - start + 1 : 0

  const t = CNC_PROCESSES.find((proc) => proc.id === type) ?? null
  const alloy = CNC_ALLOYS.find((a) => a.id === alloyId) ?? null
  const alloyCode = alloy
    ? alloy.code
    : t
      ? ALLOY_TO_VERIFY
      : (CNC_ALLOYS.find((a) => a.id === DEFAULT_CNC_ALLOY_ID)?.code ?? '----')
  const alloyLabel = alloy ? alloy.label : t ? 'A verificar en banco de ajuste' : '--'
  const polymerItem = CNC_POLYMERS.find((item) => item.id === polymer) ?? null
  const p = polymerItem ? { label: polymerItem.label, shrink: formatShrink(polymerItem.shrinkagePct) } : null
  const ready = !!(type && polymer && pares > 0)
  const contactReady = contactName.trim().length >= 2 && !!(contactEmail.trim() || contactPhone.trim()) && privacyAccepted
  const canSubmit = ready && contactReady && submit.phase !== 'sending'
  const [fichaOpen, setFichaOpen] = useState(false)
  const quote = submit.phase === 'done' ? submit.quote : null
  const fieldErrors = submit.phase === 'error' && submit.result.kind === 'validation' ? submit.result.fields : {}

  const step2Active = !!type
  const step4Active = !!type && !!polymer

  const projectCode =
    quote ? quote.publicCode : `REQ-${alloyCode}-${t ? t.code + String(pares || 0).padStart(2, '0') : '[X]'}`
  const geoLabel =
    geoMode === 'cad' ? 'CAD nativo · pendiente de adjuntar' : 'Muestra física · pendiente de recepción en taller'

  const whatsappSummary = [
    `Solicitud de cotización técnica — ${projectCode}`,
    `Requerimiento: ${t ? t.label : '--'}`,
    `Aleación: ${alloyLabel}`,
    `Polímero: ${p ? `${p.label} (${p.shrink})` : '--'}`,
    `Geometría: ${geoLabel}`,
    `Curva de tallas: ${pares > 0 ? `${start}—${end} (${pares} pares)` : '--'}`,
    note ? `Nota: ${note}` : null,
  ]
    .filter(Boolean)
    .join('\n')
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappSummary)}`

  async function handleSubmit(forceNewKey = false) {
    if (!canSubmit || !type || !polymer) return
    const input: QuoteRequestInput = {
      processId: type,
      alloyId,
      polymerId: polymer,
      geometryMode: geoMode,
      sizeStart: start,
      sizeEnd: end,
      note,
      contact: { name: contactName, company: contactCompany, email: contactEmail, phone: contactPhone },
      privacyAccepted: true,
      website,
    }
    const payload = JSON.stringify(input)
    if (forceNewKey || submission.current?.payload !== payload) {
      submission.current = { key: crypto.randomUUID(), payload }
    }
    setSubmit({ phase: 'sending' })
    const result = await submitQuote(input, submission.current.key)
    if (result.ok) {
      // La clave se conserva: reenviar el mismo formulario es un replay (200, mismo código), no un alta nueva.
      setSubmit({ phase: 'done', quote: result.quote })
      setFichaOpen(true)
    } else {
      setSubmit({ phase: 'error', result })
    }
  }

  return (
    <section className="w-full bg-canvas-deep px-4 py-16 md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
        <SectionHeading
          tag="// SOLICITUD DE COTIZACIÓN"
          title="Configuración de matriz // Nuevo proyecto"
          badge="4 pasos // Código de seguimiento"
        />
        <p className="max-w-[62ch] font-body text-sm leading-relaxed text-muted">
          Definí el requerimiento en cuatro pasos. Al enviar, registramos la solicitud con un código de seguimiento y
          la pasamos a ingeniería. No se emiten precios en pantalla: la cotización se valida contra archivo y banco de
          ajuste.
        </p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2.3fr)_minmax(290px,1fr)]">
          {/* Columna principal: wizard */}
          <div className="flex min-w-0 flex-col gap-8">
            {/* Barra de progreso */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-1.5">
                {(['req', 'poly', 'geo', 'scale'] as const).map((key, i) => {
                  const done =
                    (i === 0 && !!type) || (i === 1 && !!polymer) || (i === 2 && false) || (i === 3 && ready)
                  const active = (i === 0 && !type) || (i === 1 && !!type && !polymer) || (i === 3 && step4Active && !ready)
                  return (
                    <div
                      key={key}
                      className={`h-1.5 flex-1 rounded-sm ${done ? 'bg-accent-red' : active ? 'bg-accent-red-light' : 'bg-metal'}`}
                    />
                  )
                })}
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] uppercase tracking-widest sm:grid-cols-4">
                <span className={type ? 'text-accent-red' : 'text-metal-deep'}>01 / Requerimiento</span>
                <span className={polymer ? 'text-accent-red' : step2Active ? 'text-main' : 'text-metal-deep'}>
                  02 / Polímero
                </span>
                <span className="text-metal-deep">03 / Geometría</span>
                <span className={ready ? 'text-accent-red' : step4Active ? 'text-main' : 'text-metal-deep'}>
                  04 / Escalado
                </span>
              </div>
            </div>

            {/* Paso 01 — Tipo de requerimiento */}
            <div className="flex flex-col gap-5 rounded-sm border border-metal bg-surface-card p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-accent-red">[01]</span>
                  <h3 className="font-sans text-lg font-bold uppercase tracking-tight text-main">
                    Tipo de requerimiento
                  </h3>
                </div>
                <StepStatus done={!!type} active={!type} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CNC_PROCESSES.map((card) => {
                  const active = type === card.id
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        setType(card.id)
                        setAlloyId(card.defaultAlloyId ?? null)
                      }}
                      className={`flex flex-col gap-3 rounded-sm border p-5 text-left transition-colors ${
                        active ? 'border-accent-red bg-surface-card-deep shadow-glow-red' : 'border-metal bg-surface-card hover:border-metal-deep'
                      }`}
                    >
                      <MaterialIcon name={card.icon} className={`text-[26px] ${active ? 'text-accent-red' : 'text-muted'}`} />
                      <span className="font-sans text-sm font-semibold uppercase tracking-tight text-main">
                        {card.label}
                      </span>
                      <span className="font-body text-xs leading-relaxed text-muted">{card.description}</span>
                      <span
                        className={`border-t border-metal/50 pt-2.5 font-mono text-[10px] uppercase tracking-widest ${
                          active ? 'text-accent-red' : 'text-muted'
                        }`}
                      >
                        [{card.tag}]
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-col gap-3 border-t border-metal/50 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Aleación del bloque:</span>
                <div className="flex flex-wrap gap-2.5">
                  {CNC_ALLOYS.map((a) => {
                    const active = alloyId === a.id
                    return (
                      <button
                        key={a.id}
                        type="button"
                        title={a.note}
                        onClick={() => setAlloyId(a.id)}
                        className={`rounded-sm border px-4 py-2 font-mono text-xs tracking-wide transition-colors ${
                          active ? 'border-accent-red bg-accent-red/10 text-main' : 'border-metal bg-surface-card-deep text-muted hover:border-metal-deep'
                        }`}
                      >
                        {a.label}
                      </button>
                    )
                  })}
                </div>
                <span className="font-mono text-[11px] tracking-wide text-muted">
                  {alloy ? alloy.note : 'Sin aleación definida: se verifica en banco de ajuste.'}
                </span>
              </div>
            </div>

            {/* Paso 02 — Parámetros de polímero */}
            <div
              className={`flex flex-col gap-5 rounded-sm border border-metal bg-surface-card p-6 transition-opacity ${
                step2Active ? 'opacity-100' : 'pointer-events-none opacity-50'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-accent-red">[02]</span>
                  <h3 className="font-sans text-lg font-bold uppercase tracking-tight text-main">
                    Parámetros de polímero
                  </h3>
                </div>
                <StepStatus done={!!polymer} active={step2Active && !polymer} />
              </div>
              <p className="max-w-[60ch] font-body text-[13px] leading-relaxed text-muted">
                Parametrizamos el factor de contracción sobre el material de inyección. Ajustamos diferentes factores
                en talón, enfranque y suelín.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {CNC_POLYMERS.map((item) => {
                  const active = polymer === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPolymer(item.id)}
                      className={`rounded-sm border px-4 py-2 font-mono text-xs tracking-wide transition-colors ${
                        active ? 'border-accent-red bg-accent-red/10 text-main' : 'border-metal bg-surface-card-deep text-muted hover:border-metal-deep'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2.5 border-t border-metal/50 pt-3.5 font-mono text-[11px] tracking-wide">
                <MaterialIcon name="straighten" className="text-[16px] text-accent-red" />
                <span className="text-muted">Factor de contracción aplicado:</span>
                <span className="font-semibold text-main">{p ? `${p.shrink} (base ${p.label})` : 'Sin material seleccionado'}</span>
              </div>
            </div>

            {/* Paso 03 — Input de geometría (placeholder visual, sin funcionalidad completa) */}
            <div
              className={`flex flex-col gap-5 rounded-sm border border-metal bg-surface-card p-6 transition-opacity ${
                step2Active ? 'opacity-100' : 'pointer-events-none opacity-50'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-accent-red">[03]</span>
                  <h3 className="font-sans text-lg font-bold uppercase tracking-tight text-main">Input de geometría</h3>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted">Próximamente</span>
              </div>

              <div className="flex w-fit max-w-full flex-wrap overflow-hidden rounded-sm border border-metal">
                <button
                  type="button"
                  onClick={() => setGeoMode('cad')}
                  className={`flex items-center gap-2 px-4.5 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                    geoMode === 'cad' ? 'bg-accent-red text-main' : 'bg-surface-card text-muted'
                  }`}
                >
                  <MaterialIcon name="folder_zip" className="text-[16px]" />
                  Archivo CAD nativo
                </button>
                <button
                  type="button"
                  onClick={() => setGeoMode('muestra')}
                  className={`flex items-center gap-2 border-l border-metal px-4.5 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                    geoMode === 'muestra' ? 'bg-accent-red text-main' : 'bg-surface-card text-muted'
                  }`}
                >
                  <MaterialIcon name="architecture" className="text-[16px]" />
                  Muestra física u horma
                </button>
              </div>

              {geoMode === 'cad' ? (
                <div className="flex flex-col gap-4">
                  <div
                    aria-disabled="true"
                    title="La recepción de archivos CAD todavía no está disponible en esta vista"
                    className="flex cursor-not-allowed flex-col items-center gap-3 rounded-sm border border-dashed border-metal-deep bg-accent-red/[0.02] px-6 py-11 text-center"
                  >
                    <MaterialIcon name="cloud_upload" className="text-[30px] text-muted" />
                    <span className="font-sans text-sm font-semibold uppercase tracking-tight text-main">
                      Adjuntar archivo 3D
                    </span>
                    <span className="font-mono text-[11px] tracking-wide text-muted">
                      Formatos: .STEP · .STL · .IGES · .DXF — Máx. 250 MB
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                      // Función en desarrollo — se habilita en una próxima entrega
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-metal bg-surface-card-deep px-4 py-3 font-mono text-[11px] tracking-wide">
                    <span className="flex items-center gap-2.5 text-muted">
                      <MaterialIcon name="folder_zip" className="text-[16px] text-muted" />
                      Ningún archivo en cola
                    </span>
                    <span className="text-muted">Esperando disponibilidad de la función</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {['Frente', 'Perfil', 'Pisada'].map((label, i) => (
                      <div
                        key={label}
                        aria-disabled="true"
                        title="La carga de fotos todavía no está disponible en esta vista"
                        className="flex cursor-not-allowed flex-col gap-2.5 rounded-sm border border-dashed border-metal-deep bg-surface-card-deep px-4.5 py-4.5"
                      >
                        <MaterialIcon name="upload_file" className="text-[20px] text-muted" />
                        <span className="font-mono text-[11px] uppercase tracking-widest text-main">
                          Foto 0{i + 1} — {label}
                        </span>
                        <span className="font-mono text-[10px] text-muted">Próximamente</span>
                      </div>
                    ))}
                  </div>
                  <div
                    aria-disabled="true"
                    title="El agendamiento de escaneo todavía no está disponible en esta vista"
                    className="flex cursor-not-allowed items-center gap-3 rounded-sm border border-metal bg-surface-card-deep px-4 py-3.5"
                  >
                    <span className="font-mono text-sm text-muted">[ ]</span>
                    <span className="font-mono text-[11px] tracking-wide text-main">
                      Requiere digitalización / escaneo láser en taller
                    </span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted">
                      Próximamente
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Paso 04 — Escalado y generación */}
            <div
              className={`flex flex-col gap-5 rounded-sm border border-metal bg-surface-card p-6 transition-opacity ${
                step4Active ? 'opacity-100' : 'pointer-events-none opacity-50'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-accent-red">[04]</span>
                  <h3 className="font-sans text-lg font-bold uppercase tracking-tight text-main">
                    Escalado y generación
                  </h3>
                </div>
                <StepStatus done={ready && !!quote} active={step4Active && !ready} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Talla inicial:</span>
                  <input
                    type="number"
                    value={sizeStart}
                    onChange={(e) => setSizeStart(e.target.value)}
                    className="w-full rounded-sm border border-metal bg-canvas px-3.5 py-3 font-mono text-base font-semibold text-main outline-none focus:border-accent-red"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Talla final:</span>
                  <input
                    type="number"
                    value={sizeEnd}
                    onChange={(e) => setSizeEnd(e.target.value)}
                    className="w-full rounded-sm border border-metal bg-canvas px-3.5 py-3 font-mono text-base font-semibold text-main outline-none focus:border-accent-red"
                  />
                </label>
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Pares de matrices:</span>
                  <div className="rounded-sm border border-metal bg-surface-card-deep px-3.5 py-3 font-mono text-base font-semibold text-accent-green">
                    {pares > 0 ? String(pares).padStart(2, '0') : '--'}
                  </div>
                </div>
              </div>
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Nota para ingeniería (opcional):
                </span>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ej.: enfranque con radio reducido, logotipo grabado en talón, entrega escalonada por talla."
                  className="w-full resize-y rounded-sm border border-metal bg-canvas px-3.5 py-3 font-body text-[13px] leading-relaxed text-main outline-none focus:border-accent-red"
                />
              </label>
              <div className="flex flex-col gap-4 border-t border-metal/50 pt-5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent-red">// Datos de contacto</span>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Nombre y apellido:</span>
                    <input value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" maxLength={120} className={inputClass} />
                    <FieldError message={fieldErrors['contact.name']} />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Empresa (opcional):</span>
                    <input value={contactCompany} onChange={(e) => setContactCompany(e.target.value)} autoComplete="organization" maxLength={120} className={inputClass} />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Email:</span>
                    <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} autoComplete="email" maxLength={200} className={inputClass} />
                    <FieldError message={fieldErrors['contact.email']} />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Teléfono / WhatsApp:</span>
                    <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} autoComplete="tel" maxLength={32} className={inputClass} />
                    <FieldError message={fieldErrors['contact.phone']} />
                  </label>
                </div>
                {/* Honeypot (ADR-0010): invisible para personas, los bots lo completan. */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                />
                <label className="flex items-start gap-3 font-body text-[13px] leading-relaxed text-muted">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 accent-accent-red"
                  />
                  <span>
                    Acepto que LACERS guarde estos datos para responder la cotización. Usamos el email o teléfono solo
                    para este proyecto.
                  </span>
                </label>
                <FieldError message={fieldErrors.privacyAccepted} />
                <span className="font-mono text-[10px] tracking-wide text-muted">Dejanos al menos un email o un teléfono.</span>
              </div>
              <div className="flex flex-col gap-3.5 border-t border-metal/50 pt-5">
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => void handleSubmit()}
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-sm bg-accent-red px-6 py-4 font-mono text-xs uppercase tracking-widest text-main shadow-glow-red transition-shadow hover:shadow-glow-red-lg disabled:cursor-not-allowed disabled:bg-metal disabled:text-muted disabled:shadow-none"
                >
                  <MaterialIcon name={submit.phase === 'sending' ? 'progress_activity' : 'send'} className="text-[18px]" />
                  {submit.phase === 'sending' ? 'Registrando solicitud…' : 'Enviar solicitud a ingeniería'}
                </button>
                {submit.phase === 'error' ? (
                  <div role="alert" className="flex flex-col gap-3 rounded-sm border border-accent-red/60 bg-accent-red/10 px-4 py-3.5">
                    <span className="font-mono text-[11px] tracking-wide text-main">{submit.result.message}</span>
                    {submit.result.kind === 'key_reused' ? (
                      <button
                        type="button"
                        onClick={() => void handleSubmit(true)}
                        className="w-fit rounded-sm border border-metal px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-main transition-colors hover:border-accent-red"
                      >
                        Enviar los cambios como nueva solicitud
                      </button>
                    ) : null}
                    {submit.result.kind === 'unavailable' ? (
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => void handleSubmit()}
                          className="rounded-sm border border-metal px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-main transition-colors hover:border-accent-red"
                        >
                          Reintentar
                        </button>
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-sm border border-accent-green/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-accent-green"
                        >
                          Enviar por WhatsApp
                        </a>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className={`flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest ${canSubmit ? 'text-accent-green' : 'text-muted'}`}>
                  <MaterialIcon name={canSubmit ? 'verified' : 'engineering'} className="text-[16px]" />
                  {!ready
                    ? 'Completá los pasos 01, 02 y 04 para habilitar el envío'
                    : !contactReady
                      ? 'Completá tus datos de contacto y aceptá la privacidad'
                      : 'Configuración válida // lista para envío'}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar — resumen y SLA */}
          <div className="flex min-w-0 flex-col gap-0 self-start rounded-sm border border-metal border-t-2 border-t-accent-red bg-canvas lg:sticky lg:top-24">
            <div className="flex items-center gap-2.5 border-b border-metal px-5 py-4">
              <StatusPulseDot className="bg-accent-green" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-accent-green">
                {quote ? 'Status: solicitud registrada' : 'Status: en configuración'}
              </span>
            </div>

            <div className="flex flex-col gap-2 border-b border-metal px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Código de proyecto:</span>
              <span className="font-mono text-2xl font-semibold tracking-tight text-main">{projectCode}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-green">
                // Asignado automáticamente
              </span>
            </div>

            <div className="flex flex-col gap-4 border-b border-metal bg-canvas-deep px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-red">
                // Parámetros de proceso
              </span>
              <div className="flex flex-col gap-3.5">
                {[
                  { label: 'Aleación sugerida:', value: t || alloy ? alloyLabel : 'Aluminio 7075-T6 (billet)' },
                  { label: 'Contracción calculada:', value: p ? `${p.shrink} (base ${p.label})` : '-- (sin base)' },
                  { label: 'Tolerancia activa:', value: t ? t.tolerance : '±0.05 mm' },
                  { label: 'Máquina asignada:', value: t ? t.machine : 'Pendiente de asignación' },
                ].map((row, i) => (
                  <div key={row.label} className={`flex flex-col gap-1 ${i > 0 ? 'border-t border-metal/50 pt-3.5' : ''}`}>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{row.label}</span>
                    <span className="font-mono text-xs font-semibold text-main">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-metal px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-red">
                // Resumen de configuración
              </span>
              {[
                { label: 'Requerimiento:', value: t ? t.label : '--' },
                { label: 'Polímero:', value: p ? p.label : '--' },
                { label: 'Geometría:', value: geoLabel },
                { label: 'Curva de tallas:', value: pares > 0 ? `${start} — ${end}` : '--' },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between gap-3 font-mono text-[11px] ${i > 0 ? 'border-t border-metal/50 pt-3' : ''}`}
                >
                  <span className="text-muted">{row.label}</span>
                  <span className="text-right font-semibold text-main">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 border-b border-metal bg-canvas-deep px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent-green">
                // SLA de respuesta
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                Tiempo de cotización estimado:
              </span>
              <span className="font-sans text-xl font-bold uppercase tracking-tight text-accent-green">
                &lt; 12 horas
              </span>
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-wide text-muted">
                <MaterialIcon name="lock" className="text-[16px] text-muted" />
                Archivos bajo NDA — no se comparten con terceros
              </div>
            </div>

            <div className="px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-metal-deep">
              LACERS Matricería Industrial S.R.L. // Buenos Aires, AR
            </div>
          </div>
        </div>
      </div>

      {fichaOpen && quote ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-canvas/90 p-6 backdrop-blur-sm">
          <div className="flex max-h-[86vh] w-full max-w-[520px] flex-col gap-5 overflow-auto rounded-sm border border-metal border-t-2 border-t-accent-red bg-surface-card p-7 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-accent-red">
                  // Solicitud registrada
                </span>
                <span className="break-all font-mono text-xl font-semibold text-main">{quote.publicCode}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent-green">
                  // Código de seguimiento: citalo al hablar con ingeniería
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFichaOpen(false)}
                className="rounded-sm border border-metal px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted transition-colors hover:border-metal-deep hover:text-main"
              >
                Cerrar
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Requerimiento:', value: t ? t.label : '--' },
                { label: 'Polímero / contracción:', value: `${p ? p.label : '--'} / ${formatShrink(quote.shrinkagePct)}` },
                { label: 'Geometría:', value: geoLabel },
                { label: 'Curva / pares:', value: `${start}—${end} / ${quote.pairs} pares` },
                { label: 'Aleación / tolerancia:', value: `${alloyLabel} / ${t ? t.tolerance : '--'}` },
                { label: 'Máquina:', value: t ? t.machine : '--' },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={`flex justify-between gap-3 font-mono text-[11px] ${i > 0 ? 'border-t border-metal/50 pt-3' : ''}`}
                >
                  <span className="text-muted">{row.label}</span>
                  <span className="text-right text-main">{row.value}</span>
                </div>
              ))}
            </div>
            {quote.storage === 'memory' ? (
              <p className="rounded-sm border border-metal bg-canvas px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-accent-red-light">
                // Modo local: sin DATABASE_URL la solicitud queda en memoria y no se persiste
              </p>
            ) : null}
            <p className="font-body text-[13px] leading-relaxed text-muted">
              Ingeniería ya tiene tu solicitud. Respuesta con cotización en menos de 24 horas hábiles. Si querés
              adelantar el archivo o sumar detalles, escribinos por WhatsApp con el código.
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setFichaOpen(false)}
              className="flex items-center justify-center gap-2.5 rounded-sm bg-accent-green px-4 py-3.5 font-mono text-xs font-semibold uppercase tracking-widest text-canvas"
            >
              <MaterialIcon name="chat" className="text-[18px]" />[ Seguir por WhatsApp con ingeniería ]
            </a>
          </div>
        </div>
      ) : null}
    </section>
  )
}
