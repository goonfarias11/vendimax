"use client";

import { KPICard } from "@/components/dashboard/kpi-card";
import { SimpleBarChart } from "@/components/dashboard/simple-chart";
import { BarChart3, TrendingUp, Users, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const safeNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export default function ReportesPage() {
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalClients: 0,
    weekSalesData: [] as { label: string; value: number }[],
    monthData: [] as { label: string; value: number }[],
    paymentMethods: [] as { metodo: string; porcentaje: number; monto: number }[],
  });

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sales");
      if (!res.ok) throw new Error("Error al cargar datos");
      
      const data = await res.json();
      const sales = Array.isArray(data) ? data : data.sales || [];
      setSalesData(sales);

      // Calcular total de ventas
      const totalSales = sales.reduce((sum: number, sale: any) => sum + safeNumber(sale.total), 0);

      // Calcular total de productos vendidos
      const totalProducts = sales.reduce((sum: number, sale: any) => {
        return sum + (sale.saleItems?.reduce((itemSum: number, item: any) => 
          itemSum + safeNumber(item.quantity), 0) || 0);
      }, 0);

      // Contar clientes únicos
      const uniqueClients = new Set(sales.map((s: any) => s.clientId).filter(Boolean));

      // Ventas por día de la semana
      const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const salesByDay: { [key: number]: number } = {};
      sales.forEach((sale: any) => {
        const day = new Date(sale.createdAt).getDay();
        salesByDay[day] = (salesByDay[day] || 0) + safeNumber(sale.total);
      });
      
      const weekSalesData = weekDays.map((label, index) => ({
        label,
        value: salesByDay[index] || 0
      }));

      // Ventas por mes (últimos 4 meses)
      const monthsData: { [key: string]: number } = {};
      sales.forEach((sale: any) => {
        const date = new Date(sale.createdAt);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        monthsData[monthKey] = (monthsData[monthKey] || 0) + safeNumber(sale.total);
      });

      const sortedMonths = Object.entries(monthsData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-4);

      const monthData = sortedMonths.map(([key, value], index) => ({
        label: `Mes ${index + 1}`,
        value
      }));

      // Métodos de pago
      const paymentTotals: { [key: string]: number } = {};
      sales.forEach((sale: any) => {
        const method = sale.paymentMethod || 'Efectivo';
        paymentTotals[method] = (paymentTotals[method] || 0) + safeNumber(sale.total);
      });

      const totalPayments = Object.values(paymentTotals).reduce((sum, val) => sum + val, 0);
      const paymentMethods = Object.entries(paymentTotals).map(([metodo, monto]) => ({
        metodo,
        monto,
        porcentaje: totalPayments > 0 ? (monto / totalPayments) * 100 : 0
      }));

      setStats({
        totalSales,
        totalProducts,
        totalClients: uniqueClients.size,
        weekSalesData,
        monthData,
        paymentMethods
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleGenerateReport = () => {
    const reportData = {
      ventasTotales: `$${stats.totalSales.toLocaleString()}`,
      productosVendidos: stats.totalProducts,
      clientesUnicos: stats.totalClients,
      ventasSemanales: stats.weekSalesData,
      ventasMensuales: stats.monthData,
      metodosPago: stats.paymentMethods,
      fecha: new Date().toLocaleDateString('es-AR')
    };
    
    console.log("Reporte generado:", reportData);
    
    // Mostrar notificación animada
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando reportes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notificación animada */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 shadow-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600 animate-in zoom-in duration-300" />
            <div>
              <p className="font-semibold text-green-900">¡Reporte generado exitosamente!</p>
              <p className="text-sm text-green-700">Los datos están disponibles en la consola</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between print:block">
        <div>
          <h1 className="text-3xl font-bold text-foreground print:text-black">Reportes</h1>
          <p className="text-muted-foreground print:text-gray-600">Análisis y estadísticas del negocio</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handleExportPDF}>Exportar PDF</Button>
          <Button onClick={handleGenerateReport}>Generar Reporte</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Ventas Totales"
          value={`$${stats.totalSales.toLocaleString()}`}
          change={`${salesData.length} ventas`}
          trend="up"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <KPICard
          title="Productos Vendidos"
          value={stats.totalProducts.toLocaleString()}
          change="Total unidades"
          trend="up"
          icon={<Package className="h-6 w-6" />}
        />
        <KPICard
          title="Clientes Únicos"
          value={stats.totalClients.toString()}
          change="Clientes atendidos"
          trend="up"
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard
          title="Ticket Promedio"
          value={`$${salesData.length > 0 ? Math.round(stats.totalSales / salesData.length).toLocaleString() : 0}`}
          change="Por venta"
          trend="up"
          icon={<BarChart3 className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 print:break-inside-avoid">
        <div className="rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-gray-300">
          <h2 className="mb-4 text-lg font-semibold text-foreground print:text-black">Ventas por Día</h2>
          <SimpleBarChart data={stats.weekSalesData} height={250} />
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-gray-300">
          <h2 className="mb-4 text-lg font-semibold text-foreground print:text-black">Ventas por Mes</h2>
          <SimpleBarChart data={stats.monthData} height={250} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 print:break-inside-avoid">
        <div className="rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-gray-300">
          <h3 className="mb-4 text-lg font-semibold text-foreground print:text-black">
            Métodos de Pago
          </h3>
          <div className="space-y-4">
            {stats.paymentMethods.length > 0 ? (
              stats.paymentMethods.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground print:text-gray-700">{item.metodo}</span>
                    <span className="font-semibold text-foreground print:text-black">${item.monto.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary print:bg-gray-200">
                    <div
                      className="h-full bg-primary"
                      style={{ 
                        width: `${item.porcentaje}%`,
                        backgroundColor: 'hsl(217 91% 60%)',
                        WebkitPrintColorAdjust: 'exact',
                        colorAdjust: 'exact'
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No hay datos disponibles</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-gray-300">
          <h3 className="mb-4 text-lg font-semibold text-foreground print:text-black">
            Resumen de Ventas
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-card p-4 print:border-gray-300">
              <div>
                <p className="font-medium text-foreground print:text-black">Total Vendido</p>
                <p className="text-sm text-muted-foreground print:text-gray-600">{salesData.length} transacciones</p>
              </div>
              <span className="text-lg font-semibold text-foreground print:text-black">
                ${stats.totalSales.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-card p-4 print:border-gray-300">
              <div>
                <p className="font-medium text-foreground print:text-black">Productos Vendidos</p>
                <p className="text-sm text-muted-foreground print:text-gray-600">Total de unidades</p>
              </div>
              <span className="text-lg font-semibold text-foreground print:text-black">
                {stats.totalProducts.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-card p-4 print:border-gray-300">
              <div>
                <p className="font-medium text-foreground print:text-black">Ticket Promedio</p>
                <p className="text-sm text-muted-foreground print:text-gray-600">Por transacción</p>
              </div>
              <span className="text-lg font-semibold text-foreground print:text-black">
                ${salesData.length > 0 ? Math.round(stats.totalSales / salesData.length).toLocaleString() : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
