import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Corrige el scroll en cada cambio de ruta: sin hash, sube al tope (evita
 * quedar "abajo" al entrar a una página nueva desde el final de otra);
 * con hash, hace scroll suave hasta el bloque objetivo una vez montado.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      return
    }

    const id = hash.slice(1)
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(raf)
  }, [pathname, hash])

  return null
}
