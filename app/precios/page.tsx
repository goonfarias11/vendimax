"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PreciosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const planes = [
    {
      nombre: "Emprendedor",
      precio: "$8.500",
      periodo: "/mes",
      descripcion: "Perfecto para empezar",
      slug: "emprendedor",
      caracteristicas: [
        { texto: "2 usuarios", incluido: true },
        { texto: "Hasta 500 productos", incluido: true },
        { texto: "200 ventas/mes", incluido: true },
        { texto: "Reportes básicos", incluido: true },
        { texto: "1 ubicación", incluido: true },
        { texto: "Soporte por email", incluido: true },
        { texto: "Múltiples sucursales", incluido: false },
        { texto: "Reportes avanzados", incluido: false },
        { texto: "API access", incluido: false },
        { texto: "Soporte prioritario", incluido: false },
      ],
      destacado: false,
    },
    {
      nombre: "Pyme",
      precio: "$14.000",
      periodo: "/mes",
      descripcion: "Para negocios en crecimiento",
      slug: "pyme",
      caracteristicas: [
        { texto: "5 usuarios", incluido: true },
        { texto: "Hasta 2.000 productos", incluido: true },
        { texto: "1.000 ventas/mes", incluido: true },
        { texto: "Reportes avanzados", incluido: true },
        { texto: "Múltiples sucursales", incluido: true },
        { texto: "Soporte prioritario", incluido: true },
        { texto: "Facturación electrónica (ARCA)", incluido: true },
        { texto: "Exportación CSV/PDF", incluido: true },
        { texto: "API access", incluido: false },
        { texto: "Soporte 24/7", incluido: false },
      ],
      destacado: true,
    },
    {
      nombre: "Full",
      precio: "$22.000",
      periodo: "/mes",
      descripcion: "Para grandes empresas",
      slug: "full",
      caracteristicas: [
        { texto: "Usuarios ilimitados", incluido: true },
        { texto: "Productos ilimitados", incluido: true },
        { texto: "Ventas ilimitadas", incluido: true },
        { texto: "Reportes personalizados", incluido: true },
        { texto: "Ubicaciones ilimitadas", incluido: true },
        { texto: "Soporte 24/7", incluido: true },
        { texto: "API personalizada", incluido: true },
        { texto: "Gerente de cuenta dedicado", incluido: true },
        { texto: "Personalización de marca", incluido: true },
        { texto: "Integración avanzada", incluido: true },
      ],
      destacado: false,
    },
  ];

  async function handlePlanClick(slug: string) {
    if (status === "loading") return;

    // Sin sesión → registrarse primero
    if (!session?.user) {
      router.push(`/registro?plan=${slug}`);
      return;
    }

    // Con sesión → ir al checkout
    setLoading(slug);
    try {
      const res = await fetch("/api/subscriptions-ars/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: slug, billingCycle: "monthly" }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "No se pudo iniciar la suscripción");
        return;
      }

      if (data.paymentLink) {
        window.location.href = data.paymentLink;
      } else if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        router.push("/dashboard/suscripcion");
      }
    } catch {
      alert("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planes y Precios
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Elegí el plan que mejor se adapta a tu negocio. Sin contratos, cancelá cuando quieras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {planes.map((plan) => (
            <div
              key={plan.slug}
              className={`relative rounded-2xl border-2 p-8 flex flex-col ${
                plan.destacado
                  ? "border-blue-600 shadow-xl scale-105"
                  : "border-gray-200 shadow-md"
              }`}
            >
              {plan.destacado && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Más popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{plan.nombre}</h2>
                <p className="text-gray-500 text-sm mb-4">{plan.descripcion}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.precio}</span>
                  <span className="text-gray-500">{plan.periodo}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.caracteristicas.map((c, i) => (
                  <li key={i} className="flex items-center gap-3">
                    {c.incluido ? (
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 shrink-0" />
                    )}
                    <span className={c.incluido ? "text-gray-700" : "text-gray-400"}>
                      {c.texto}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanClick(plan.slug)}
                disabled={loading === plan.slug || status === "loading"}
                className={`w-full py-3 font-semibold ${
                  plan.destacado
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-900 hover:bg-gray-800 text-white"
                }`}
              >
                {loading === plan.slug ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </span>
                ) : session?.user ? (
                  "Suscribirme"
                ) : (
                  "Empezar Ahora"
                )}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-12">
          Todos los precios incluyen IVA. Podés cancelar en cualquier momento desde tu dashboard.
        </p>
      </div>

      <Footer />
    </main>
  );
}
