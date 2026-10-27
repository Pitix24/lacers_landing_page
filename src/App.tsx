import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import CotizadorTecnicoPage from '@/pages/CotizadorTecnicoPage'
import ScrollToTop from '@/components/ScrollToTop'

// El panel admin va en un chunk aparte: no suma peso a la landing.
const AdminPage = lazy(() => import('@/pages/AdminPage'))

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cotizador-tecnico" element={<CotizadorTecnicoPage />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
              <AdminPage />
            </Suspense>
          }
        />
      </Routes>
    </>
  )
}
