"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const planes = [
  {
    nombre: "Básico",
    precio: "$8.500",
    descripcion: "Perfecto para empezar",
    features: [
      "3 usuarios",
      "Hasta 500 productos",
      "1.000 ventas/mes",
      "Reportes básicos",
      "1 ubicación",
      "Soporte por email",
    ],
    popular: false,
  },
  {
    nombre: "Pro",
    precio: "$14.000",
    descripcion: "Para negocios en crecimiento",
    features: [
      "10 usuarios",
      "Hasta 5.000 productos",
      "10.000 ventas/mes",
      "Reportes avanzados",
      "3 ubicaciones",
      "Soporte prioritario",
      "Integraciones",
      "Cuenta corriente clientes",
    ],
    popular: true,
  },
  {
    nombre: "Full",
    precio: "$22.000",
    descripcion: "Para grandes empresas",
    features: [
      "Usuarios ilimitados",
      "Productos ilimitados",
      "Ventas ilimitadas",
      "Reportes personalizados",
      "Ubicaciones ilimitadas",
      "Soporte 24/7",
      "API personalizada",
      "Gerente de cuenta dedicado",
    ],
    popular: false,
  },
];

export function PreciosSection() {
  return (
    <section id="precios" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Precios Transparentes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tu negocio. Sin costos ocultos.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {planes.map((plan, index) => (
            <motion.div
              key={plan.nombre}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Más Popular
                  </span>
                </div>
              )}
              
              <Card className={`h-full ${plan.popular ? 'border-primary border-2 shadow-xl' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.nombre}</CardTitle>
                  <CardDescription>{plan.descripcion}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.precio}</span>
                    {plan.precio !== "Personalizado" && (
                      <span className="text-gray-600">/mes</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link href="/registro">
                      Empezar Ahora
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600">
            Todos los planes incluyen 7 días de prueba gratuita con funcionalidades PRO. Sin tarjeta de crédito requerida.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
