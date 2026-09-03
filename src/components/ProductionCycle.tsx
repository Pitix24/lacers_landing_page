import { PRODUCTION_CYCLE_CARDS, PRODUCTION_CYCLE_SECTION } from '@/data/landingData'
import SectionHeading from '@/components/common/SectionHeading'
import type { ProductionCycleCard } from '@/types/landing'

function ProductionCycleCardItem({ card }: { card: ProductionCycleCard }) {
  return (
    <div className="group flex flex-col justify-between rounded-sm border border-metal bg-surface-card p-6 transition-colors duration-200 hover:border-accent-red">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-accent-red">{card.code}</span>
          <span className="rounded-sm bg-surface-card-deep px-2 py-0.5 font-mono text-[11px] text-muted">
            {card.tag}
          </span>
        </div>
        <h3 className="font-sans text-lg font-bold uppercase text-main transition-colors group-hover:text-accent-red-light">
          {card.title}
        </h3>
        <p className="font-body text-sm leading-relaxed text-muted">{card.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-metal/60 pt-4 font-mono text-[11px]">
        <span className="uppercase text-muted">{card.statusLabel}</span>
        <span className="font-semibold text-main">{card.statusValue}</span>
      </div>
    </div>
  )
}

export default function ProductionCycle() {
  return (
    <section id="servicios" className="w-full bg-canvas px-4 py-16 md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
        <SectionHeading
          tag={PRODUCTION_CYCLE_SECTION.tag}
          title={PRODUCTION_CYCLE_SECTION.title}
          badge={PRODUCTION_CYCLE_SECTION.badge}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PRODUCTION_CYCLE_CARDS.map((card) => (
            <ProductionCycleCardItem key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
