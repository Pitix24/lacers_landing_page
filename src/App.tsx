import { Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import CotizadorTecnicoPage from '@/pages/CotizadorTecnicoPage'
import ScrollToTop from '@/components/ScrollToTop'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cotizador-tecnico" element={<CotizadorTecnicoPage />} />
      </Routes>
    </>
  )
}
