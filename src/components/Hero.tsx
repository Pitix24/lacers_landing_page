import { Link } from 'react-router-dom'
import { HERO_CONTENT, HERO_MICRO_CHECKS, WHATSAPP_NUMBER } from '@/data/landingData'
import MaterialIcon from '@/components/common/MaterialIcon'
import StatusPulseDot from '@/components/common/StatusPulseDot'
import CncTelemetryCard from '@/components/CncTelemetryCard'

export default function Hero() {
  return (
    <section className="w-full bg-canvas px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-8 xl:grid-cols-12 xl:gap-12">
        {/* Columna izquierda: titular, descripción y CTAs */}
        <div className="flex flex-col gap-4 xl:col-span-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-sm border border-metal bg-surface-card px-3 py-1">
            <StatusPulseDot />
            <span className="font-mono text-xs uppercase tracking-widest text-muted">{HERO_CONTENT.statusTag}</span>
          </div>

          <h1 className="font-sans text-3xl font-bold uppercase tracking-tight text-main sm:text-4xl lg:text-5xl xl:text-6xl">
            {HERO_CONTENT.title}
          </h1>

          <p className="max-w-2xl font-body text-base leading-relaxed text-muted lg:text-lg">
            {HERO_CONTENT.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to={HERO_CONTENT.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-sm bg-accent-red px-5 py-3 font-sans text-sm font-bold uppercase tracking-wider text-main shadow-glow-red transition-shadow hover:shadow-glow-red-lg"
            >
              <MaterialIcon name={HERO_CONTENT.primaryCta.icon} className="text-[18px]" />
              <span>{HERO_CONTENT.primaryCta.label}</span>
            </Link>
            <a
              href={HERO_CONTENT.secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-sm border border-metal bg-surface-card px-5 py-3 font-sans text-sm font-semibold uppercase tracking-wider text-main transition-colors hover:border-metal-deep"
            >
              <MaterialIcon name={HERO_CONTENT.secondaryCta.icon} className="text-[18px] text-muted" />
              <span>{HERO_CONTENT.secondaryCta.label}</span>
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-3 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-main"
            >
              <MaterialIcon name={HERO_CONTENT.whatsappCta.icon} className="text-[16px] text-accent-green" />
              <span>{HERO_CONTENT.whatsappCta.label}</span>
            </a>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-metal/50 pt-3 sm:grid-cols-3">
            {HERO_MICRO_CHECKS.map((check) => (
              <div key={check.id} className="flex items-center gap-2">
                <MaterialIcon name={check.icon} className="text-[16px] text-accent-red" />
                <span className="font-mono text-xs uppercase text-muted">{check.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha: telemetría CNC interactiva */}
        <div className="relative xl:col-span-6">
          <CncTelemetryCard />
        </div>
      </div>
    </section>
  )
}
