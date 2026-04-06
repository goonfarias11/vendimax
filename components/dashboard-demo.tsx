"use client";

import { type ReactNode } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import Link from "next/link";

type KPI = {
  title: string;
  value: string;
  sub: string;
  icon: ReactNode;
};

const kpis: KPI[] = [
  {
    title: "Ventas Hoy",
    value: "$12.340",
    sub: "18 tickets",
    icon: <DollarSign className="h-5 w-5 text-slate-500" />,
  },
  {
    title: "Total del Mes",
    value: "$240.000",
    sub: "Ventas acumuladas",
    icon: <TrendingUp className="h-5 w-5 text-slate-500" />,
  },
  {
    title: "Tickets Hoy",
    value: "18",
    sub: "Promedio $685",
    icon: <ShoppingCart className="h-5 w-5 text-slate-500" />,
  },
  {
    title: "Stock Bajo",
    value: "7",
    sub: "Requiere reposicion",
    icon: <Package className="h-5 w-5 text-slate-500" />,
  },
];

const ultimasVentas = [
  { id: "D-1045", cliente: "Cliente demo", fecha: "17/3, 08:14 p. m.", items: 3 },
  { id: "D-1044", cliente: "Cliente demo", fecha: "17/3, 08:00 p. m.", items: 5 },
  { id: "D-1043", cliente: "Anonimo", fecha: "17/3, 07:32 p. m.", items: 2 },
  { id: "D-1042", cliente: "Anonimo", fecha: "17/3, 06:58 p. m.", items: 1 },
  { id: "D-1041", cliente: "Cliente demo", fecha: "17/3, 06:15 p. m.", items: 4 },
];

const topProductos = [
  { producto: "Combo demo A", vendidos: 42, total: "$58.800" },
  { producto: "Bebida demo", vendidos: 37, total: "$33.300" },
  { producto: "Snack demo", vendidos: 28, total: "$22.400" },
];

export function DashboardDemo() {
  return (
    <section id="demo" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            Demo
            <span className="text-slate-500 font-medium">No mostramos datos reales</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-600">Resumen de tu negocio en tiempo real (datos de ejemplo)</p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.title}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-slate-500">{kpi.title}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{kpi.value}</p>
                <p className="text-sm text-emerald-600 mt-1">{kpi.sub}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">{kpi.icon}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Ultimas ventas */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Ultimas Ventas</h3>
              <Link href="#" className="text-sm font-semibold text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-slate-700">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2">ID</th>
                    <th className="py-2">Cliente</th>
                    <th className="py-2">Fecha</th>
                    <th className="py-2 text-right pr-2">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasVentas.map((venta) => (
                    <tr key={venta.id} className="border-b border-slate-100 last:border-none">
                      <td className="py-2">{venta.id}</td>
                      <td className="py-2">{venta.cliente}</td>
                      <td className="py-2">{venta.fecha}</td>
                      <td className="py-2 text-right pr-2">{venta.items}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top productos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-900">Productos Mas Vendidos</h3>
              <Link href="#" className="text-sm font-semibold text-primary hover:underline">
                Ver reportes
              </Link>
            </div>
            <table className="w-full text-sm text-slate-700">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Producto</th>
                  <th className="py-2">Vendidos</th>
                  <th className="py-2 text-right pr-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {topProductos.map((p) => (
                  <tr key={p.producto} className="border-b border-slate-100 last:border-none">
                    <td className="py-2">{p.producto}</td>
                    <td className="py-2">{p.vendidos}</td>
                    <td className="py-2 text-right pr-2">{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acciones rapidas */}
        <div className="grid gap-3 md:grid-cols-3">
          <CTA
            href="/dashboard/ventas/nueva"
            title="Nueva Venta"
            subtitle="Registrar una venta rapida"
            color="bg-blue-600"
          />
          <CTA
            href="/dashboard/productos"
            title="Gestionar Productos"
            subtitle="Ver y actualizar inventario"
            color="bg-blue-700"
          />
          <CTA href="/dashboard/mi-caja" title="Mi Caja" subtitle="Gestionar mi turno de caja" color="bg-emerald-600" />
        </div>
      </div>
    </section>
  );
}

function CTA({ href, title, subtitle, color }: { href: string; title: string; subtitle: string; color: string }) {
  return (
    <Link
      href={href}
      className={`${color} text-white rounded-xl px-5 py-5 shadow-sm hover:opacity-95 transition`}
    >
      <div className="text-xl font-semibold mb-1">{title}</div>
      <div className="text-sm text-white/80">{subtitle}</div>
    </Link>
  );
}
