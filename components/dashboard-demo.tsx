"use client";

import { motion } from "framer-motion";
import { BarChart3, ShoppingBag, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardDemo() {
  return (
    <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Vista previa del Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Una interfaz limpia y moderna para gestionar tu negocio
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 shadow-2xl"
        >
          <div className="bg-white rounded-xl p-6">
            {/* Header del dashboard */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <h3 className="text-2xl font-bold text-gray-900">Dashboard</h3>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Ventas Hoy
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">$12,345</div>
                  <p className="text-xs text-green-600 mt-1">+20.1% vs ayer</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Pedidos
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">145</div>
                  <p className="text-xs text-green-600 mt-1">+12% vs ayer</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Productos
                  </CardTitle>
                  <Package className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">892</div>
                  <p className="text-xs text-gray-500 mt-1">En inventario</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Crecimiento
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">+34%</div>
                  <p className="text-xs text-green-600 mt-1">Este mes</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart Area */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas de la Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-end justify-around p-4">
                    {[40, 70, 50, 90, 60, 85, 75].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${height}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="w-12 bg-blue-500 rounded-t-lg"
                      />
                    ))}
                  </div>
                  <div className="flex justify-around mt-2 text-xs text-gray-600">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Productos Más Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Producto A', sales: 234, color: 'bg-blue-500' },
                      { name: 'Producto B', sales: 189, color: 'bg-green-500' },
                      { name: 'Producto C', sales: 156, color: 'bg-purple-500' },
                      { name: 'Producto D', sales: 123, color: 'bg-orange-500' },
                    ].map((product, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${product.color}`} />
                        <span className="text-sm text-gray-700 flex-grow">{product.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{product.sales}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
