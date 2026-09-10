import { Link } from 'react-router-dom'
import { CTA_BANNER_CONTENT } from '@/data/landingData'
import MaterialIcon from '@/components/common/MaterialIcon'
import StatusPulseDot from '@/components/common/StatusPulseDot'

export default function CtaBanner() {
  return (
    <section id="cotizacion" className="w-full bg-canvas px-4 py-16 md:px-8 lg:px-12">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-sm border border-metal border-t-2 border-t-accent-red bg-canvas-deep p-8 shadow-panel md:p-16">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-10" />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-sm border border-metal bg-surface-card px-3 py-1">
            <StatusPulseDot />
            <span className="font-mono text-xs uppercase tracking-wide text-muted">
              {CTA_BANNER_CONTENT.statusLabel}
            </span>
          </div>

          <h2 className="font-sans text-2xl font-bold uppercase tracking-tight text-main md:text-4xl">
            {CTA_BANNER_CONTENT.title}
          </h2>

          <p className="font-body text-base leading-relaxed text-muted lg:text-lg">
            {CTA_BANNER_CONTENT.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to={CTA_BANNER_CONTENT.cta.to}
              className="inline-flex items-center gap-2 rounded-sm bg-accent-red px-6 py-4 font-sans text-sm font-bold uppercase tracking-wider text-main shadow-glow-red-lg transition-shadow hover:shadow-[0_0_32px_rgba(220,38,38,0.7)]"
            >
              <MaterialIcon name={CTA_BANNER_CONTENT.cta.icon} className="text-[20px]" />
              <span>{CTA_BANNER_CONTENT.cta.label}</span>
            </Link>
          </div>

          <div className="mt-4 flex w-full flex-col items-center justify-center gap-4 border-t border-metal/40 pt-4 font-mono text-xs text-muted md:flex-row">
            {CTA_BANNER_CONTENT.guarantees.map((guarantee) => (
              <div key={guarantee.id} className="flex items-center gap-2">
                <MaterialIcon name={guarantee.icon} className="text-[16px] text-accent-red" />
                <span>{guarantee.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
