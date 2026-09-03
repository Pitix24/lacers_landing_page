import type { MaterialIconName } from '@/types/landing'

interface MaterialIconProps {
  name: MaterialIconName
  className?: string
}

/** Envuelve un glifo de Material Symbols Outlined con tipado estricto del nombre. */
export default function MaterialIcon({ name, className = '' }: MaterialIconProps) {
  return (
    <span className={`material-symbols-outlined leading-none ${className}`} aria-hidden="true">
      {name}
    </span>
  )
}
