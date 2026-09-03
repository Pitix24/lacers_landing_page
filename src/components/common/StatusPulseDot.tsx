interface StatusPulseDotProps {
  className?: string
}

/** Punto de estado "en línea" con animación de pulso, reutilizado en navbar y CTA banner. */
export default function StatusPulseDot({ className = 'bg-accent-red' }: StatusPulseDotProps) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${className}`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${className}`} />
    </span>
  )
}
