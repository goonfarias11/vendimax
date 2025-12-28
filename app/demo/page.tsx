"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { 
  Play, 
  CheckCircle, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Loader2,
  ArrowRight
} from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function DemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDemoAccess = async () => {
    setLoading(true);
    
    try {
      // Intentar login con credenciales de demo
      const result = await signIn("credentials", {
        email: "demo@vendimax.com",
        password: "demo123",
        redirect: false,
      });

      if (result?.ok) {
        toast.success("¡Bienvenido al demo de VendiMax!");
        router.push("/dashboard");
      } else {
        toast.error("Error al acceder al demo. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al acceder al demo");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: ShoppingCart,
      title: "Procesar Ventas",
      description: "Prueba crear ventas con múltiples productos y métodos de pago",
    },
    {
      icon: Package,
      title: "Gestionar Inventario",
      description: "Agrega, edita y controla el stock de productos",
    },
    {
      icon: Users,
      title: "Administrar Clientes",
      description: "Registra clientes y consulta su historial de compras",
    },
    {
      icon: BarChart3,
      title: "Ver Reportes",
      description: "Analiza ventas, productos y rendimiento del negocio",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
              <Play className="h-10 w-10 text-primary" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Prueba VendiMax Gratis
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Explora todas las funcionalidades sin necesidad de registrarte. 
              El entorno demo se resetea automáticamente cada 24 horas.
            </p>

            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={handleDemoAccess}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Accediendo...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Acceder al Demo
                </>
              )}
            </Button>

            <p className="text-sm text-gray-500 mt-4">
              No se requiere tarjeta de crédito ni registro
            </p>
          </div>

          {/* Qué puedes hacer */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              ¿Qué puedes hacer en el demo?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Datos de prueba */}
          <div className="bg-blue-50 rounded-2xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Datos de Prueba Incluidos
            </h2>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">15+</div>
                <div className="text-gray-600">Productos</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">5+</div>
                <div className="text-gray-600">Clientes</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">10+</div>
                <div className="text-gray-600">Ventas de Ejemplo</div>
              </div>
            </div>
          </div>

          {/* Limitaciones */}
          <Card className="p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Limitaciones del Demo
            </h2>

            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Todos los datos se resetean cada 24 horas automáticamente
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  No se pueden enviar emails reales ni generar facturas oficiales
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  El entorno es compartido (otros usuarios pueden ver tus cambios)
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  Algunas funcionalidades avanzadas están deshabilitadas
                </span>
              </li>
            </ul>
          </Card>

          {/* CTA Final */}
          <div className="text-center bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              ¿Listo para usar VendiMax en tu negocio?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Crea tu cuenta gratis y empieza a gestionar tu negocio hoy mismo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-lg"
                onClick={() => router.push("/registro")}
              >
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg bg-white/10 border-white text-white hover:bg-white/20"
                onClick={() => router.push("/precios")}
              >
                Ver Precios Transparentes
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
