import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CNC_ALLOYS, CNC_POLYMERS, CNC_PROCESSES } from '@/data/landingData'
import { QUOTE_STATUSES, type AdminQuoteRow, type AdminQuotesResponse, type ApiErrorBody, type QuoteStatus } from '@/lib/cotizador/api'
import MaterialIcon from '@/components/common/MaterialIcon'
import SectionHeading from '@/components/common/SectionHeading'

// Panel /admin (listado). Auth provisoria por ADMIN_TOKEN en sessionStorage hasta spec-04 (ADR-0008).

const TOKEN_KEY = 'lacers.admin.token'

const STATUS_LABEL: Record<QuoteStatus, string> = {
  nueva: 'Nueva',
  en_revision: 'En revisión',
  cotizada: 'Cotizada',
  cerrada: 'Cerrada',
  descartada: 'Descartada',
}

const STATUS_CLASS: Record<QuoteStatus, string> = {
  nueva: 'border-accent-red text-accent-red',
  en_revision: 'border-accent-red-light/60 text-accent-red-light',
  cotizada: 'border-accent-green text-accent-green',
  cerrada: 'border-metal-deep text-main',
  descartada: 'border-metal text-muted',
}

const labelOf = (items: { id: string; label: string }[], id: string | null, fallback: string) =>
  id ? (items.find((item) => item.id === id)?.label ?? id) : fallback

const dateFormat = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })

type LoadState =
  | { phase: 'idle' | 'loading' }
  | { phase: 'ready'; data: AdminQuotesResponse }
  | { phase: 'error'; message: string }

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '')
  const [tokenDraft, setTokenDraft] = useState('')
  const [status, setStatus] = useState<QuoteStatus | ''>('')
  const [query, setQuery] = useState('')
  const [includeSpam, setIncludeSpam] = useState(false)
  const [state, setState] = useState<LoadState>({ phase: 'idle' })

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setState({ phase: 'idle' })
  }, [])

  const load = useCallback(async () => {
    if (!token) return
    setState({ phase: 'loading' })
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (query.trim()) params.set('q', query.trim())
    if (includeSpam) params.set('spam', '1')
    try {
      const response = await fetch(`/api/admin/quotes?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (response.status === 401) return logout()
      const body = (await response.json().catch(() => null)) as AdminQuotesResponse | ApiErrorBody | null
      if (!response.ok || !body || !('items' in body)) {
        const message = body && 'error' in body ? body.error.message : 'No pudimos cargar las cotizaciones.'
        return setState({ phase: 'error', message })
      }
      setState({ phase: 'ready', data: body })
    } catch {
      setState({ phase: 'error', message: 'No pudimos conectar con el servidor.' })
    }
  }, [token, status, query, includeSpam, logout])

  useEffect(() => {
    void load()
    // Búsqueda por texto solo al enviar el formulario; filtros de estado y spam recargan al cambiar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status, includeSpam])

  function handleLogin(event: FormEvent) {
    event.preventDefault()
    const value = tokenDraft.trim()
    if (!value) return
    sessionStorage.setItem(TOKEN_KEY, value)
    setToken(value)
    setTokenDraft('')
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-main">
      <header className="flex items-center justify-between border-b border-metal bg-canvas-deep px-4 py-4 md:px-8">
        <Link to="/" className="font-mono text-xs uppercase tracking-widest text-muted hover:text-main">
          ← LACERS CNC
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-widest text-accent-red">// Panel admin</span>
        {token ? (
          <button
            type="button"
            onClick={logout}
            className="rounded-sm border border-metal px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted transition-colors hover:border-metal-deep hover:text-main"
          >
            Salir
          </button>
        ) : (
          <span />
        )}
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-10 md:px-8">
        <SectionHeading tag="// COTIZACIONES" title="Solicitudes del cotizador técnico" badge={state.phase === 'ready' ? `${state.data.items.length} registros` : undefined} />

        {!token ? (
          <form onSubmit={handleLogin} className="flex max-w-md flex-col gap-4 rounded-sm border border-metal bg-surface-card p-6">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Token de administrador:</span>
              <input
                type="password"
                value={tokenDraft}
                onChange={(e) => setTokenDraft(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-sm border border-metal bg-canvas px-3.5 py-3 font-mono text-sm text-main outline-none focus:border-accent-red"
              />
            </label>
            <button
              type="submit"
              className="rounded-sm bg-accent-red px-5 py-3 font-mono text-xs uppercase tracking-widest text-main shadow-glow-red transition-shadow hover:shadow-glow-red-lg"
            >
              Ingresar
            </button>
            <span className="font-mono text-[10px] tracking-wide text-muted">
              Se guarda solo en esta pestaña (sessionStorage) hasta que salgas.
            </span>
          </form>
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void load()
              }}
              className="flex flex-wrap items-end gap-4 rounded-sm border border-metal bg-surface-card p-4"
            >
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Estado:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as QuoteStatus | '')}
                  className="rounded-sm border border-metal bg-canvas px-3 py-2.5 font-mono text-xs text-main outline-none focus:border-accent-red"
                >
                  <option value="">Todos</option>
                  {QUOTE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[220px] flex-1 flex-col gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Código o folio:</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="REQ-7075-MC08-000123"
                  className="rounded-sm border border-metal bg-canvas px-3 py-2.5 font-mono text-xs text-main outline-none focus:border-accent-red"
                />
              </label>
              <label className="flex items-center gap-2 pb-2.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                <input type="checkbox" checked={includeSpam} onChange={(e) => setIncludeSpam(e.target.checked)} className="accent-accent-red" />
                Incluir spam
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-sm border border-metal px-4 py-2.5 font-mono text-[10px] uppercase tracking-widest text-main transition-colors hover:border-accent-red"
              >
                <MaterialIcon name="search" className="text-[16px]" />
                Buscar
              </button>
            </form>

            {state.phase === 'ready' && state.data.storage === 'memory' ? (
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent-red-light">
                // Modo local: sin DATABASE_URL, las solicitudes viven en memoria del servidor de desarrollo
              </p>
            ) : null}

            {state.phase === 'loading' || state.phase === 'idle' ? (
              <p className="font-mono text-xs uppercase tracking-widest text-muted">Cargando cotizaciones…</p>
            ) : null}
            {state.phase === 'error' ? (
              <div role="alert" className="flex items-center gap-4 rounded-sm border border-accent-red/60 bg-accent-red/10 px-4 py-3">
                <span className="font-mono text-xs text-main">{state.message}</span>
                <button type="button" onClick={() => void load()} className="font-mono text-[10px] uppercase tracking-widest text-accent-red-light">
                  Reintentar
                </button>
              </div>
            ) : null}
            {state.phase === 'ready' && state.data.items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed border-metal-deep bg-surface-card px-6 py-12 text-center">
                <MaterialIcon name="inbox" className="text-[30px] text-muted" />
                <span className="font-sans text-sm font-semibold uppercase tracking-tight text-main">Sin cotizaciones</span>
                <span className="font-mono text-[11px] tracking-wide text-muted">
                  Todavía no hay solicitudes con estos filtros.
                </span>
              </div>
            ) : null}
            {state.phase === 'ready' && state.data.items.length > 0 ? <QuotesTable items={state.data.items} /> : null}
          </>
        )}
      </main>
    </div>
  )
}

function QuotesTable({ items }: { items: AdminQuoteRow[] }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-metal">
      <table className="w-full min-w-[960px] border-collapse text-left">
        <thead className="bg-surface-card-deep">
          <tr className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {['Código', 'Fecha', 'Requerimiento', 'Aleación', 'Polímero', 'Tallas', 'Contacto', 'Estado'].map((h) => (
              <th key={h} className="border-b border-metal px-4 py-3 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((q) => (
            <tr key={q.id} className="border-b border-metal/50 bg-surface-card align-top font-mono text-[11px] text-main last:border-b-0">
              <td className="px-4 py-3">
                <span className="font-semibold">{q.publicCode}</span>
                {q.isSpecialCase ? (
                  <span className="mt-1 block text-[10px] uppercase tracking-widest text-accent-red-light">
                    // {q.specialReasons.join(' · ')}
                  </span>
                ) : null}
                {q.isSpam ? <span className="mt-1 block text-[10px] uppercase tracking-widest text-muted">// spam</span> : null}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{dateFormat.format(new Date(q.createdAt))}</td>
              <td className="px-4 py-3">
                {labelOf(CNC_PROCESSES, q.processId, '--')}
                <span className="block text-[10px] uppercase tracking-widest text-muted">{q.geometryMode === 'cad' ? 'CAD' : 'Muestra'}</span>
              </td>
              <td className="px-4 py-3">{labelOf(CNC_ALLOYS, q.alloyId, 'A verificar')}</td>
              <td className="px-4 py-3">
                {labelOf(CNC_POLYMERS, q.polymerId, '--')}
                <span className="block text-muted">{q.shrinkagePct.toFixed(1)}%</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {q.sizeStart}—{q.sizeEnd}
                <span className="block text-accent-green">{q.pairs} pares</span>
              </td>
              <td className="px-4 py-3">
                {q.contactName}
                {q.contactCompany ? <span className="block text-muted">{q.contactCompany}</span> : null}
                {q.contactEmail ? <span className="block break-all text-muted">{q.contactEmail}</span> : null}
                {q.contactPhone ? <span className="block text-muted">{q.contactPhone}</span> : null}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block whitespace-nowrap rounded-sm border px-2 py-1 text-[10px] uppercase tracking-widest ${STATUS_CLASS[q.status]}`}>
                  {STATUS_LABEL[q.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
