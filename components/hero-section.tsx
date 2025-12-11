"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-gray-50 -z-10" />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block mb-4">
              <span className="bg-blue-100 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
                ✨ Sistema POS Moderno
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Gestiona tu negocio con
              <span className="text-primary"> VendiMax</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              La solución completa para punto de venta que necesitas. Control total de ventas, 
              inventario y clientes desde una sola plataforma intuitiva.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button size="lg" className="text-base" asChild>
                <Link href="/registro">
                  Empezar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link href="#demo">
                  <Play className="mr-2 h-5 w-5" />
                  Ver Demo
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600">Negocios activos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600">Soporte</div>
              </div>
            </div>
          </motion.div>

          {/* Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-lg p-6">
                {/* Mockup simple del dashboard */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-blue-50 rounded-lg p-4">
                      <div className="h-4 w-20 bg-blue-200 rounded mb-2" />
                      <div className="h-6 w-16 bg-blue-300 rounded" />
                    </div>
                    <div className="h-24 bg-green-50 rounded-lg p-4">
                      <div className="h-4 w-20 bg-green-200 rounded mb-2" />
                      <div className="h-6 w-16 bg-green-300 rounded" />
                    </div>
                  </div>
                  <div className="h-32 bg-gray-50 rounded-lg" />
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
            >
              ✓ Fácil de usar
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
            >
              ⚡ Super rápido
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
