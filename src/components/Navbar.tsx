import { NAV_LINKS } from '@/data/landingData'
import MaterialIcon from '@/components/common/MaterialIcon'
import StatusPulseDot from '@/components/common/StatusPulseDot'

export default function Navbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-canvas-deep/90 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 md:px-8 lg:px-12">
        <a href="#" className="flex shrink-0 items-center gap-3">
          <img
            src="/assets/images/logo-lacers-wordmark.jpg"
            alt="Logo LACERS Precision CNC Tooling"
            className="h-8 w-8 rounded-sm object-cover"
          />
          <div className="hidden flex-col leading-none sm:flex">
            <span className="font-sans text-sm font-bold uppercase tracking-tight text-main">LACERS</span>
            <span className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
              Precision CNC &amp; Tooling
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className="font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:text-main"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 rounded-sm bg-surface-card px-3 py-1 2xl:flex">
            <StatusPulseDot className="bg-accent-green" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Planta activa // CNC 5-Axis Online
            </span>
          </div>
          <a
            href="#cotizacion"
            className="inline-flex items-center gap-2 rounded-sm bg-accent-red px-3 py-2 font-sans text-xs font-bold uppercase tracking-wider text-main shadow-glow-red transition-shadow hover:shadow-glow-red-lg md:px-4"
          >
            <span className="hidden sm:inline">Solicitar Cotización Técnica</span>
            <MaterialIcon name="precision_manufacturing" className="text-[18px] sm:hidden" />
          </a>
          <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-accent-red md:flex">
            <MaterialIcon name="person" className="text-[18px] text-main" />
          </div>
        </div>
      </div>
    </header>
  )
}
