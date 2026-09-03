import {
  FOOTER_BRAND,
  FOOTER_CERTIFICATIONS,
  FOOTER_CONTACT_ITEMS,
  FOOTER_LEGAL,
  FOOTER_LINK_GROUPS,
  FOOTER_SHIFT_LABEL,
} from '@/data/landingData'
import MaterialIcon from '@/components/common/MaterialIcon'

export default function Footer() {
  return (
    <footer className="w-full bg-canvas-deep pb-8 pt-16">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 pb-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="font-sans text-xl font-bold tracking-tight text-main">{FOOTER_BRAND.name}</span>
              <span className="rounded-sm bg-surface-card px-2 py-0.5 font-mono text-[11px] text-muted">
                {FOOTER_BRAND.certificationBadge}
              </span>
            </div>
            <p className="font-body text-sm leading-relaxed text-muted">{FOOTER_BRAND.description}</p>
            <div className="flex items-center gap-2 font-mono text-xs text-muted">
              <MaterialIcon name="verified" className="text-[16px] text-accent-red" />
              <span>{FOOTER_BRAND.toleranceLabel}</span>
            </div>
          </div>

          {/* Grupos de enlaces (soluciones, polímeros) */}
          {FOOTER_LINK_GROUPS.map((group) => (
            <div key={group.id} className="flex flex-col gap-3">
              <h4 className="font-mono text-xs uppercase tracking-widest text-main">{group.title}</h4>
              <nav className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    className="font-body text-sm text-muted transition-colors hover:text-main"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          ))}

          {/* Ingeniería y planta */}
          <div className="flex flex-col gap-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-main">Ingeniería &amp; Planta</h4>
            <div className="flex flex-col gap-2 font-body text-sm text-muted">
              {FOOTER_CONTACT_ITEMS.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <MaterialIcon name={item.icon} className="text-[16px] text-muted" />
                  <span>{item.label}</span>
                </div>
              ))}
              <span className="mt-1 font-mono text-xs font-semibold text-accent-red">{FOOTER_SHIFT_LABEL}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-metal pt-6 md:flex-row">
          <span className="font-mono text-xs tracking-wide text-muted">{FOOTER_LEGAL}</span>
          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs text-muted">
            {FOOTER_CERTIFICATIONS.map((cert) => (
              <span key={cert.id} className="cursor-pointer hover:text-main">
                {cert.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
