"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, FileText, CreditCard, Users, Settings } from "lucide-react";
import { motion } from "framer-motion";

const funciones = [
  {
    icon: ShoppingCart,
    title: "Punto de Venta",
    description: "Interfaz intuitiva para procesar ventas rápidamente",
    features: ["Búsqueda rápida de productos", "Múltiples métodos de pago", "Códigos de barras"],
  },
  {
    icon: Package,
    title: "Gestión de Inventario",
    description: "Control total de tu stock en tiempo real",
    features: ["Alertas de stock bajo", "Control de lotes", "Múltiples almacenes"],
  },
  {
    icon: FileText,
    title: "Facturación Electrónica",
    description: "Genera facturas y comprobantes al instante",
    features: ["Cumplimiento fiscal", "Envío por email", "Notas de crédito"],
  },
  {
    icon: CreditCard,
    title: "Múltiples Pagos",
    description: "Acepta todos los métodos de pago",
    features: ["Efectivo", "Tarjetas", "Transferencias"],
  },
  {
    icon: Users,
    title: "CRM Integrado",
    description: "Gestiona la relación con tus clientes",
    features: ["Historial de compras", "Programas de lealtad", "Segmentación"],
  },
  {
    icon: Settings,
    title: "Personalizable",
    description: "Adapta el sistema a tu negocio",
    features: ["Roles y permisos", "Configuración flexible", "Integraciones"],
  },
];

export function FuncionesSection() {
  return (
    <section id="funciones" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Funcionalidades Completas
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Todo lo que necesitas para gestionar tu negocio en un solo lugar
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {funciones.map((funcion, index) => {
            const Icon = funcion.icon;
            return (
              <motion.div
                key={funcion.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-2 hover:border-primary/50">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{funcion.title}</CardTitle>
                    <CardDescription className="text-base">
                      {funcion.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {funcion.features.map((feature) => (
                        <li key={feature} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
