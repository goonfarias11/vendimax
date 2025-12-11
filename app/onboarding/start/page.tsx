"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Store, Users, Package, BarChart3 } from "lucide-react";

export default function OnboardingStartPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold mb-2">¡Bienvenido a VendiMax! 🎉</CardTitle>
          <CardDescription className="text-lg">
            Vamos a configurar tu cuenta en solo 2 minutos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureItem
              icon={<Store className="h-6 w-6" />}
              title="Tu Negocio"
              description="Configuraremos la información básica de tu comercio"
            />
            <FeatureItem
              icon={<Package className="h-6 w-6" />}
              title="Productos"
              description="Agregaremos tus primeros productos de ejemplo"
            />
            <FeatureItem
              icon={<Users className="h-6 w-6" />}
              title="Equipo"
              description="Configuraremos roles y usuarios"
            />
            <FeatureItem
              icon={<BarChart3 className="h-6 w-6" />}
              title="Reportes"
              description="Activaremos dashboards y estadísticas"
            />
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Check className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Tu Prueba Gratuita está Activa</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>✓ 7 días de acceso completo al plan PRO</li>
                  <li>✓ Hasta 5,000 productos</li>
                  <li>✓ 10,000 ventas por mes</li>
                  <li>✓ Reportes avanzados</li>
                  <li>✓ Sin tarjeta de crédito requerida</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push("/onboarding/business")}
              size="lg"
              className="w-full"
            >
              Comenzar Configuración
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Saltar e Ir al Dashboard
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Puedes completar esta configuración más tarde desde el dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
