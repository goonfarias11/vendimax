"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function OnboardingDonePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    completeSetup();
  }, []);

  const completeSetup = async () => {
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al completar configuración");
      }

      setSetupComplete(true);
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-lg font-medium">Configurando tu sistema...</p>
              <p className="text-sm text-gray-600 text-center">
                Estamos creando productos demo, configurando roles y preparando tu dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error en la Configuración</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Ir al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-20 w-20 text-green-600" />
          </div>
          <CardTitle className="text-4xl font-bold mb-2">¡Todo Listo! 🎉</CardTitle>
          <CardDescription className="text-lg">
            Tu cuenta está configurada y lista para usar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="font-semibold text-lg mb-3">¿Qué configuramos?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Tu negocio con información básica</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Productos de ejemplo para que pruebes el sistema</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Roles y permisos de usuario</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Dashboard con reportes en tiempo real</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>7 días de prueba gratuita del plan PRO</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-lg mb-3">Próximos Pasos</h3>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>Explora el dashboard y familiarízate con el sistema</li>
              <li>Agrega tus productos reales</li>
              <li>Realiza tu primera venta desde el POS</li>
              <li>Revisa los reportes y estadísticas</li>
              <li>Invita a tu equipo si tienes más usuarios</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button onClick={() => router.push("/dashboard")} size="lg" className="w-full">
              Ir al Dashboard
            </Button>
            <Button
              onClick={() => router.push("/dashboard/pos")}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Ir al Punto de Venta
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Si necesitas ayuda, visita nuestro{" "}
            <a href="/help" className="text-blue-600 hover:underline">
              Centro de Ayuda
            </a>{" "}
            o contáctanos por email
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
