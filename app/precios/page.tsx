"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import Link from "next/link";

export default function PreciosPage() {
  const planes = [
    {
      nombre: "Plan Free",
      precio: "Gratis",
      descripcion: "Perfecto para empezar",
      caracteristicas: [
        { texto: "Hasta 100 productos", incluido: true },
        { texto: "Hasta 50 ventas/mes", incluido: true },
        { texto: "1 usuario", incluido: true },
        { texto: "Métodos de pago básicos", incluido: true },
        { texto: "Reportes básicos", incluido: true },
        { texto: "Soporte por email", incluido: true },
        { texto: "Múltiples sucursales", incluido: false },
        { texto: "Reportes avanzados", incluido: false },
        { texto: "API access", incluido: false },
        { texto: "Soporte prioritario", incluido: false },
      ],
      destacado: false,
      botonTexto: "Empezar Gratis",
      botonHref: "/registro",
    },
    {
      nombre: "Plan Pro",
      precio: "$14.000",
      periodo: "/mes",
      descripcion: "Para negocios en crecimiento",
      caracteristicas: [
        { texto: "Productos ilimitados", incluido: true },
        { texto: "Ventas ilimitadas", incluido: true },
        { texto: "Usuarios ilimitados", incluido: true },
        { texto: "Todos los métodos de pago", incluido: true },
        { texto: "Reportes avanzados", incluido: true },
        { texto: "Múltiples sucursales", incluido: true },
        { texto: "API access completo", incluido: true },
        { texto: "Exportación CSV/PDF", incluido: true },
        { texto: "Soporte prioritario 24/7", incluido: true },
        { texto: "Personalización de marca", incluido: true },
      ],
      destacado: true,
      botonTexto: "Empezar Prueba Gratis",
      botonHref: "/registro?plan=pro",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Planes y Precios
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tu negocio. Cambia o cancela cuando quieras.
            </p>
          </div>

          {/* Comparación de planes */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {planes.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  plan.destacado
                    ? "bg-primary text-white shadow-2xl scale-105 border-4 border-primary"
                    : "bg-white border-2 border-gray-200"
                }`}
              >
                {plan.destacado && (
                  <div className="text-center mb-4">
                    <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">
                      🌟 Más Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h2
                    className={`text-2xl font-bold mb-2 ${
                      plan.destacado ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.nombre}
                  </h2>
                  <p
                    className={`text-sm mb-4 ${
                      plan.destacado ? "text-white/80" : "text-gray-600"
                    }`}
                  >
                    {plan.descripcion}
                  </p>
                  <div className="flex items-end justify-center gap-1">
                    <span
                      className={`text-5xl font-bold ${
                        plan.destacado ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plan.precio}
                    </span>
                    {plan.periodo && (
                      <span
                        className={`text-lg mb-2 ${
                          plan.destacado ? "text-white/80" : "text-gray-600"
                        }`}
                      >
                        {plan.periodo}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.caracteristicas.map((caracteristica, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {caracteristica.incluido ? (
                        <Check
                          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                            plan.destacado ? "text-white" : "text-green-500"
                          }`}
                        />
                      ) : (
                        <X
                          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                            plan.destacado ? "text-white/40" : "text-gray-300"
                          }`}
                        />
                      )}
                      <span
                        className={`text-sm ${
                          caracteristica.incluido
                            ? plan.destacado
                              ? "text-white"
                              : "text-gray-700"
                            : plan.destacado
                            ? "text-white/40"
                            : "text-gray-400"
                        }`}
                      >
                        {caracteristica.texto}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.destacado
                      ? "bg-white text-primary hover:bg-gray-100"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                  size="lg"
                  asChild
                >
                  <Link href={plan.botonHref}>{plan.botonTexto}</Link>
                </Button>
              </div>
            ))}
          </div>

          {/* FAQ de precios */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Preguntas Frecuentes
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  ¿Puedo cambiar de plan en cualquier momento?
                </h3>
                <p className="text-gray-600">
                  Sí, puedes actualizar o cambiar tu plan cuando quieras. Los cambios se reflejan inmediatamente.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  ¿Ofrecen reembolsos?
                </h3>
                <p className="text-gray-600">
                  Sí, ofrecemos garantía de reembolso de 30 días en el Plan Pro sin preguntas.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  ¿El Plan Free es realmente gratis para siempre?
                </h3>
                <p className="text-gray-600">
                  Sí, el Plan Free es completamente gratuito para siempre, con las limitaciones indicadas.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  ¿Cómo funciona la prueba gratis del Plan Pro?
                </h3>
                <p className="text-gray-600">
                  Obtienes 14 días de acceso completo al Plan Pro sin necesidad de tarjeta de crédito.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
