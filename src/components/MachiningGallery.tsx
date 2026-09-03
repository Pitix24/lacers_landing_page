import { GALLERY_CARDS, GALLERY_SECTION } from '@/data/landingData'
import SectionHeading from '@/components/common/SectionHeading'
import type { GalleryCard } from '@/types/landing'

function GalleryCardItem({ card }: { card: GalleryCard }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-sm border border-metal bg-surface-card">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-canvas-deep">
        <img
          src={card.image}
          alt={card.alt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute right-2 top-2 rounded-sm border border-metal bg-canvas-deep/90 px-2 py-1 font-mono text-[11px] text-main">
          {card.code}
        </div>
      </div>
      <div className="flex flex-col gap-2 p-5">
        <h3 className="font-sans text-lg font-bold uppercase text-main">{card.title}</h3>
        <p className="font-body text-sm leading-relaxed text-muted">{card.description}</p>
        <div className="mt-2 flex items-center justify-between border-t border-metal pt-2 font-mono text-[11px]">
          <span className="text-muted">{card.specLabel}</span>
          <span className="font-semibold text-main">{card.specValue}</span>
        </div>
      </div>
    </div>
  )
}

export default function MachiningGallery() {
  return (
    <section id="galeria-cnc" className="w-full bg-canvas px-4 py-16 md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8">
        <SectionHeading tag={GALLERY_SECTION.tag} title={GALLERY_SECTION.title} badge={GALLERY_SECTION.badge} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {GALLERY_CARDS.map((card) => (
            <GalleryCardItem key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  )
}
