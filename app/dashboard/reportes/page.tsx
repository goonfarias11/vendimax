"use client";

import { KPICard } from "@/components/dashboard/kpi-card";
import { SimpleBarChart } from "@/components/dashboard/simple-chart";
import { BarChart3, TrendingUp, Users, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { weekSalesData } from "@/lib/mock-data";

export default function ReportesPage() {
  const monthData = [
    { label: "Sem 1", value: 456000 },
    { label: "Sem 2", value: 523000 },
    { label: "Sem 3", value: 489000 },
    { label: "Sem 4", value: 612000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Análisis y estadísticas del negocio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Exportar PDF</Button>
          <Button>Generar Reporte</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ventas Totales"
          value="$2,080,000"
          change="+18.2% vs mes anterior"
          trend="up"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <KPICard
          title="Productos Vendidos"
          value="1,248"
          change="+12.5%"
          trend="up"
          icon={<Package className="h-6 w-6" />}
        />
        <KPICard
          title="Nuevos Clientes"
          value="84"
          change="+22.1%"
          trend="up"
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard
          title="Tasa Conversión"
          value="68.5%"
          change="+5.2%"
          trend="up"
          icon={<BarChart3 className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Ventas Semanales</h2>
          <SimpleBarChart data={weekSalesData} height={250} />
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Ventas Mensuales</h2>
          <SimpleBarChart data={monthData} height={250} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Métodos de Pago
          </h3>
          <div className="space-y-4">
            {[
              { metodo: "Tarjeta de Crédito/Débito", porcentaje: 45, monto: 936000 },
              { metodo: "Efectivo", porcentaje: 35, monto: 728000 },
              { metodo: "Transferencia", porcentaje: 20, monto: 416000 },
            ].map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.metodo}</span>
                  <span className="text-gray-900">${item.monto.toLocaleString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${item.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Categorías Más Vendidas
          </h3>
          <div className="space-y-4">
            {[
              { categoria: "Electrónica", ventas: 145, ingresos: 1250000 },
              { categoria: "Accesorios", ventas: 234, ingresos: 450000 },
              { categoria: "Audio", ventas: 89, ingresos: 380000 },
            ].map((cat, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{cat.categoria}</p>
                  <p className="text-sm text-gray-500">{cat.ventas} unidades</p>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  ${cat.ingresos.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
