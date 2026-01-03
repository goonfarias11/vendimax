import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { BeneficiosSection } from "@/components/beneficios-section";
import { FuncionesSection } from "@/components/funciones-section";
import { PreciosSection } from "@/components/precios-section";
import { DashboardDemo } from "@/components/dashboard-demo";
import { Footer } from "@/components/footer";

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <BeneficiosSection />
      <FuncionesSection />
      <DashboardDemo />
      <PreciosSection />
      <Footer />
    </main>
  );
}
