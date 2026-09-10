import { Route, Routes } from 'react-router-dom'
import Home from '@/pages/Home'
import CotizadorTecnicoPage from '@/pages/CotizadorTecnicoPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cotizador-tecnico" element={<CotizadorTecnicoPage />} />
    </Routes>
  )
}
