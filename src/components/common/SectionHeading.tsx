import type { ReactNode } from 'react'

interface SectionHeadingProps {
  tag: string
  title: string
  badge?: ReactNode
  id?: string
}

/** Cabecera técnica reutilizada por las secciones de contenido (tag "//", título H2 y badge normativo). */
export default function SectionHeading({ tag, title, badge }: SectionHeadingProps) {
  return (
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div className="flex flex-col gap-2">
        <span className="tag-technical">{tag}</span>
        <h2 className="font-sans text-2xl font-bold uppercase tracking-tight text-main md:text-4xl">{title}</h2>
      </div>
      {badge ? (
        <span className="font-mono text-xs uppercase tracking-wider text-muted">{badge}</span>
      ) : null}
    </div>
  )
}
