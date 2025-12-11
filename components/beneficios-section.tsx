"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, TrendingUp, Users, BarChart3, Clock } from "lucide-react";
import { motion } from "framer-motion";

const beneficios = [
  {
    icon: Zap,
    title: "Rápido y Eficiente",
    description: "Procesa ventas en segundos con nuestra interfaz optimizada y fluida.",
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Tus datos protegidos con encriptación de nivel empresarial.",
  },
  {
    icon: TrendingUp,
    title: "Aumenta tus Ventas",
    description: "Insights en tiempo real para tomar mejores decisiones de negocio.",
  },
  {
    icon: Users,
    title: "Gestión de Clientes",
    description: "Mantén un registro completo de tus clientes y sus compras.",
  },
  {
    icon: BarChart3,
    title: "Reportes Detallados",
    description: "Analiza tu negocio con reportes y gráficos personalizables.",
  },
  {
    icon: Clock,
    title: "Ahorra Tiempo",
    description: "Automatiza tareas repetitivas y enfócate en crecer tu negocio.",
  },
];

export function BeneficiosSection() {
  return (
    <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ¿Por qué elegir VendiMax?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Diseñado para negocios modernos que buscan eficiencia y crecimiento
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {beneficios.map((beneficio, index) => {
            const Icon = beneficio.icon;
            return (
              <motion.div
                key={beneficio.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{beneficio.title}</CardTitle>
                    <CardDescription className="text-base">
                      {beneficio.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
