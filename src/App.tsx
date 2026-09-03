import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import MetricsBar from '@/components/MetricsBar'
import ProductionCycle from '@/components/ProductionCycle'
import MaterialsShrinkage from '@/components/MaterialsShrinkage'
import MachiningGallery from '@/components/MachiningGallery'
import CertifiedWorkflow from '@/components/CertifiedWorkflow'
import CtaBanner from '@/components/CtaBanner'
import Footer from '@/components/Footer'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-main">
      <Navbar />
      <main className="w-full pt-16">
        <Hero />
        <MetricsBar />
        <ProductionCycle />
        <MaterialsShrinkage />
        <MachiningGallery />
        <CertifiedWorkflow />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}
