import Navbar from '@/components/Navbar'
import CotizadorTecnico from '@/components/CotizadorTecnico'
import Footer from '@/components/Footer'

export default function CotizadorTecnicoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-main">
      <Navbar />
      <main className="w-full pt-16">
        <CotizadorTecnico />
      </main>
      <Footer />
    </div>
  )
}
