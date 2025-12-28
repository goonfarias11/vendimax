"use client";

import { useEffect, useState } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { DataTable } from "@/components/dashboard/data-table";
import { DollarSign, ShoppingCart, TrendingUp, Package, AlertTriangle, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type DashboardStats = {
  ventasHoy: number;
  ticketsHoy: number;
  totalMes: number;
  productosBajoStock: number;
  ultimasVentas: any[];
  productosPopulares: any[];
  ultimoCierre?: {
    number: number;
    totalGeneral: number;
    from: string;
    to: string;
  };
};

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    ventasHoy: 0,
    ticketsHoy: 0,
    totalMes: 0,
    productosBajoStock: 0,
    ultimasVentas: [],
    productosPopulares: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch en paralelo de todos los datos
      const [salesRes, productsRes] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/products"),
      ]);

      if (!salesRes.ok) {
        const errorData = await salesRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al cargar ventas");
      }

      if (!productsRes.ok) {
        const errorData = await productsRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al cargar productos");
      }

      const salesData = await salesRes.json();
      const products = await productsRes.json();

      // Extraer array de ventas (soporta formato antiguo y nuevo)
      const sales = Array.isArray(salesData) ? salesData : salesData.sales || [];
      
      // Validar que sean arrays
      if (!Array.isArray(sales) || !Array.isArray(products)) {
        throw new Error("Error: Respuesta inválida de API");
      }

      // Calcular fecha de hoy y del mes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Filtrar ventas de hoy
      const ventasHoy = sales.filter((s: any) => {
        const saleDate = new Date(s.createdAt);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      });

      // Filtrar ventas del mes
      const ventasMes = sales.filter((s: any) => {
        const saleDate = new Date(s.createdAt);
        return saleDate >= startOfMonth;
      });

      // Calcular totales
      const totalHoy = ventasHoy.reduce((sum: number, s: any) => sum + Number(s.total), 0);
      const totalMes = ventasMes.reduce((sum: number, s: any) => sum + Number(s.total), 0);

      // Productos con bajo stock
      const productosBajoStock = products.filter(
        (p: any) => p.isActive && Number(p.stock) <= Number(p.minStock)
      );

      // Últimas 5 ventas
      const ultimasVentas = sales.slice(0, 5).map((s: any) => ({
        id: s.number || s.id.slice(0, 8),
        cliente: s.client?.name || "Sin cliente",
        fecha: new Date(s.createdAt).toLocaleString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        items: s.saleItems?.length || 0,
        total: Number(s.total),
        metodoPago: s.paymentMethod,
      }));

      // Productos más vendidos (contar items en ventas)
      const productSalesCount: { [key: string]: { name: string; count: number; total: number } } = {};
      
      sales.forEach((sale: any) => {
        sale.saleItems?.forEach((item: any) => {
          const productId = item.productId;
          const productName = item.product?.name || "Producto";
          const quantity = Number(item.quantity);
          const subtotal = Number(item.subtotal);

          if (!productSalesCount[productId]) {
            productSalesCount[productId] = { name: productName, count: 0, total: 0 };
          }
          productSalesCount[productId].count += quantity;
          productSalesCount[productId].total += subtotal;
        });
      });

      const productosPopulares = Object.entries(productSalesCount)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id, data]) => ({
          producto: data.name,
          vendidos: data.count,
          total: data.total,
        }));

      setStats({
        ventasHoy: totalHoy,
        ticketsHoy: ventasHoy.length,
        totalMes,
        productosBajoStock: productosBajoStock.length,
        ultimasVentas,
        productosPopulares,
      });
    } catch (error) {
      setError("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const columnsUltimasVentas = [
    { key: "id", header: "ID" },
    { key: "cliente", header: "Cliente" },
    { key: "fecha", header: "Fecha" },
    { key: "items", header: "Items" },
    {
      key: "total",
      header: "Total",
      cell: (row: any) => `$${row.total.toLocaleString()}`,
    },
  ];

  const columnsProductosPopulares = [
    { key: "producto", header: "Producto" },
    { key: "vendidos", header: "Vendidos" },
    {
      key: "total",
      header: "Total",
      cell: (row: any) => `$${row.total.toLocaleString()}`,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen de tu negocio en tiempo real</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ventas Hoy"
          value={`$${stats.ventasHoy.toLocaleString()}`}
          change={`${stats.ticketsHoy} ticket${stats.ticketsHoy !== 1 ? "s" : ""}`}
          trend="up"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <KPICard
          title="Total del Mes"
          value={`$${stats.totalMes.toLocaleString()}`}
          change="Ventas acumuladas"
          trend="up"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <KPICard
          title="Tickets Hoy"
          value={stats.ticketsHoy}
          change={
            stats.ticketsHoy > 0
              ? `Promedio: $${Math.round(stats.ventasHoy / stats.ticketsHoy).toLocaleString()}`
              : "Sin ventas aún"
          }
          trend={stats.ticketsHoy > 0 ? "up" : "neutral"}
          icon={<ShoppingCart className="h-6 w-6" />}
        />
        <KPICard
          title="Stock Bajo"
          value={stats.productosBajoStock}
          change={stats.productosBajoStock > 0 ? "Requiere atención" : "Todo bien"}
          trend={stats.productosBajoStock > 0 ? "down" : "up"}
          icon={
            stats.productosBajoStock > 0 ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <Package className="h-6 w-6" />
            )
          }
        />
      </div>

      {/* Último cierre de caja */}
      {stats.ultimoCierre && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Último Cierre de Caja #{stats.ultimoCierre.number}
              </h3>
              <p className="text-gray-600 mb-2">
                Período: {new Date(stats.ultimoCierre.from).toLocaleDateString("es-AR")} -{" "}
                {new Date(stats.ultimoCierre.to).toLocaleDateString("es-AR")}
              </p>
              <p className="text-2xl font-bold text-primary">
                ${Number(stats.ultimoCierre.totalGeneral).toLocaleString()}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/mi-caja">
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Alertas de stock bajo */}
      {stats.productosBajoStock > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                ⚠️ Productos con Stock Bajo
              </h3>
              <p className="text-gray-600 mb-3">
                Tienes {stats.productosBajoStock} producto{stats.productosBajoStock !== 1 ? "s" : ""}{" "}
                por debajo del stock mínimo configurado.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/productos">Ver Productos</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tablas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimas ventas */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Últimas Ventas</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/ventas">Ver todas</Link>
            </Button>
          </div>
          {stats.ultimasVentas.length > 0 ? (
            <DataTable columns={columnsUltimasVentas} data={stats.ultimasVentas} />
          ) : (
            <p className="text-center text-gray-500 py-8">No hay ventas registradas aún</p>
          )}
        </div>

        {/* Productos más vendidos */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/reportes">Ver reportes</Link>
            </Button>
          </div>
          {stats.productosPopulares.length > 0 ? (
            <DataTable columns={columnsProductosPopulares} data={stats.productosPopulares} />
          ) : (
            <p className="text-center text-gray-500 py-8">No hay datos de ventas aún</p>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/ventas/nueva"
          className="bg-primary hover:bg-primary/90 text-white rounded-xl p-6 transition-colors"
        >
          <ShoppingCart className="h-8 w-8 mb-3" />
          <h3 className="font-semibold mb-1">Nueva Venta</h3>
          <p className="text-sm text-white/80">Registrar una venta rápida</p>
        </Link>

        <Link
          href="/dashboard/productos"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 transition-colors"
        >
          <Package className="h-8 w-8 mb-3" />
          <h3 className="font-semibold mb-1">Gestionar Productos</h3>
          <p className="text-sm text-white/80">Ver y actualizar inventario</p>
        </Link>

        <Link
          href="/dashboard/mi-caja"
          className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-6 transition-colors"
        >
          <DollarSign className="h-8 w-8 mb-3" />
          <h3 className="font-semibold mb-1">Mi Caja</h3>
          <p className="text-sm text-white/80">Gestionar mi turno de caja</p>
        </Link>
      </div>
    </div>
  );
}
