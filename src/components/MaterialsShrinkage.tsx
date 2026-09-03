import { MATERIALS_SECTION, POLYMER_SHRINKAGE_TABLE } from '@/data/landingData'
import MaterialIcon from '@/components/common/MaterialIcon'
import type { PolymerShrinkage } from '@/types/landing'

function PolymerRow({ polymer }: { polymer: PolymerShrinkage }) {
  const barColor = polymer.barVariant === 'nominal' ? 'bg-accent-green' : 'bg-accent-red'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-mono font-bold text-main">
          {polymer.name} <span className="font-normal text-muted">{polymer.formula}</span>
        </span>
        <span className="font-mono font-bold text-accent-red">{polymer.rangeLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-sm bg-surface-card-deep">
        <div className={`h-full ${barColor}`} style={{ width: `${polymer.barWidthPct}%` }} />
      </div>
      <span className="font-mono text-xs text-muted">{polymer.note}</span>
    </div>
  )
}

export default function MaterialsShrinkage() {
  return (
    <section
      id="materiales-y-contracciones"
      className="w-full border-y border-metal bg-surface-card px-4 py-16 md:px-8 lg:px-12"
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-10 xl:grid-cols-12">
        {/* Columna izquierda: teoría de física de polímeros */}
        <div className="flex flex-col gap-4 xl:col-span-5">
          <span className="tag-technical">{MATERIALS_SECTION.tag}</span>
          <h2 className="font-sans text-2xl font-bold uppercase leading-tight tracking-tight text-main md:text-4xl">
            {MATERIALS_SECTION.title}
          </h2>
          {MATERIALS_SECTION.paragraphs.map((paragraph, i) => (
            <p key={i} className="font-body text-sm leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
          <p className="font-body text-sm leading-relaxed text-muted">
            En <span className="font-semibold text-main">LACERS</span> parametrizamos el factor de contracción
            tridimensional (<span className="font-mono text-main">Shrinkage Factor Kf</span>) en cada eje de
            desmoldeo, asegurando que la pieza terminada cumpla la tabla de talles internacional exacta.
          </p>
          <div className="flex items-start gap-3 rounded-sm border border-metal bg-canvas p-4">
            <MaterialIcon name={MATERIALS_SECTION.highlight.icon} className="mt-0.5 shrink-0 text-[22px] text-accent-red" />
            <div className="flex flex-col gap-1">
              <span className="font-sans text-sm font-bold uppercase text-main">
                {MATERIALS_SECTION.highlight.title}
              </span>
              <span className="font-body text-sm text-muted">{MATERIALS_SECTION.highlight.description}</span>
            </div>
          </div>
        </div>

        {/* Columna derecha: tabla de contracción polimérica */}
        <div className="flex flex-col gap-4 rounded-sm border border-metal bg-canvas p-6 xl:col-span-7">
          <div className="flex items-center justify-between gap-2 border-b border-metal pb-3">
            <span className="font-mono text-xs uppercase text-muted">{MATERIALS_SECTION.tableLabel}</span>
            <span className="font-mono text-xs font-semibold uppercase text-accent-red">
              {MATERIALS_SECTION.tableBadge}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {POLYMER_SHRINKAGE_TABLE.map((polymer) => (
              <PolymerRow key={polymer.id} polymer={polymer} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
