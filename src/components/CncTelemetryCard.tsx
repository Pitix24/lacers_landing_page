import { useEffect, useState } from 'react'
import {
  TELEMETRY_COORDINATES,
  TELEMETRY_FEED_READOUT,
  TELEMETRY_HEADER,
  TELEMETRY_STATUS,
  TELEMETRY_TOP_READOUTS,
} from '@/data/landingData'
import MaterialIcon from '@/components/common/MaterialIcon'

const JITTER_INTERVAL_MS = 450
const XY_JITTER_RANGE = 0.03
const Z_JITTER_RANGE = 0.008

/** Simula telemetría en vivo de un 5-axis CNC: micro-variaciones alrededor de la coordenada base. */
function useCoordinateJitter() {
  const [values, setValues] = useState(() =>
    Object.fromEntries(TELEMETRY_COORDINATES.map((c) => [c.id, c.base])),
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setValues(() =>
        Object.fromEntries(
          TELEMETRY_COORDINATES.map((c) => {
            const range = c.axis === 'Z' ? Z_JITTER_RANGE : XY_JITTER_RANGE
            const delta = Math.random() * range - range / 2
            return [c.id, c.base + delta]
          }),
        ),
      )
    }, JITTER_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return values
}

/** Recuadro interactivo HUD del Hero: render CNC en vivo, mira de calibración y telemetría de máquina. */
export default function CncTelemetryCard() {
  const coordinateValues = useCoordinateJitter()

  return (
    <div className="relative overflow-hidden rounded-sm border border-metal bg-surface-card-deep p-1 shadow-panel">
      {/* Franja de cabecera del viewport */}
      <div className="flex items-center justify-between gap-2 border-b border-metal bg-canvas-deep px-3 py-1.5 font-mono text-[11px] text-muted">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-red" />
          <span className="font-semibold text-main">{TELEMETRY_HEADER.viewportLabel}</span>
          <span>{TELEMETRY_HEADER.materialTag}</span>
        </div>
        <span className="hidden sm:inline">{TELEMETRY_HEADER.frameRate}</span>
      </div>

      {/* Render CNC activo con overlay de mira/calibración y HUD de datos */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-canvas-deep">
        <img
          src={TELEMETRY_HEADER.image}
          alt={TELEMETRY_HEADER.imageAlt}
          className="h-full w-full object-cover contrast-125 grayscale-[15%]"
        />

        <svg className="pointer-events-none absolute inset-0 h-full w-full stroke-muted opacity-25" aria-hidden="true">
          <defs>
            <pattern id="mill-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mill-grid)" />
          <circle cx="50%" cy="50%" r="32" fill="none" stroke="#DC2626" strokeWidth="1" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#DC2626" strokeWidth="0.75" strokeDasharray="4 4" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#DC2626" strokeWidth="0.75" strokeDasharray="4 4" />
        </svg>

        {/* HUD superior izquierdo: spindle y avance */}
        <div className="absolute left-2 top-2 flex flex-col gap-1 rounded-sm border border-metal bg-canvas-deep/85 px-3 py-1.5 backdrop-blur-sm">
          {TELEMETRY_TOP_READOUTS.map((readout, i) => (
            <div key={readout.id} className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
              <span>{readout.label}</span>
              <span className={`font-semibold ${readout.emphasis ? 'text-accent-red' : 'text-main'}`}>
                {readout.value}
              </span>
              {i === 0 && <span className="text-metal-deep">|</span>}
            </div>
          ))}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
            <span>{TELEMETRY_FEED_READOUT.label}</span>
            <span className="font-semibold text-main">{TELEMETRY_FEED_READOUT.value}</span>
          </div>
        </div>

        {/* HUD superior derecho: coordenadas X/Y/Z en vivo */}
        <div className="absolute right-2 top-2 rounded-sm border border-metal bg-canvas-deep/85 px-3 py-1.5 text-right font-mono text-[11px] backdrop-blur-sm">
          {TELEMETRY_COORDINATES.map((c) => (
            <div key={c.id} className="text-muted">
              {c.axis}: <span className={`font-mono ${c.emphasis ? 'font-bold text-accent-red' : 'text-main'}`}>
                {coordinateValues[c.id]?.toFixed(3)}
              </span>{' '}
              mm
            </div>
          ))}
        </div>

        {/* Barra inferior de estado de máquina */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 rounded-sm border border-metal bg-canvas-deep/90 px-3 py-1.5 font-mono text-[11px] backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <MaterialIcon name="water_drop" className="text-[14px] text-accent-green" />
            <span className="hidden uppercase text-main sm:inline">{TELEMETRY_STATUS.coolingLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted">{TELEMETRY_STATUS.statusLabel}</span>
            <span className="font-semibold uppercase text-accent-green">{TELEMETRY_STATUS.statusValue}</span>
          </div>
        </div>
      </div>

      {/* Barra de micro-ajuste bajo el viewport */}
      <div className="flex items-center justify-between gap-2 bg-surface-card px-3 py-1.5 font-mono text-[11px] text-muted">
        <span>{TELEMETRY_STATUS.calibrationLabel}</span>
        <span className="font-semibold text-muted">{TELEMETRY_STATUS.toleranceLabel}</span>
      </div>
    </div>
  )
}
