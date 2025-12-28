"use client";

import { KPICard } from "@/components/dashboard/kpi-card";
import { SimpleBarChart } from "@/components/dashboard/simple-chart";
import { BarChart3, TrendingUp, Users, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ReportesPage() {
  const [showNotification, setShowNotification] = useState(false);

  // Datos de ejemplo
  const weekSalesData = [
    { label: "Lun", value: 125000 },
    { label: "Mar", value: 145000 },
    { label: "Mié", value: 132000 },
    { label: "Jue", value: 168000 },
    { label: "Vie", value: 195000 },
    { label: "Sáb", value: 223000 },
    { label: "Dom", value: 178000 },
  ];

  const monthData = [
    { label: "Sem 1", value: 456000 },
    { label: "Sem 2", value: 523000 },
    { label: "Sem 3", value: 489000 },
    { label: "Sem 4", value: 612000 },
  ];

  const handleExportPDF = () => {
    window.print();
  };

  const handleGenerateReport = () => {
    const reportData = {
      ventasTotales: "$2,080,000",
      productosVendidos: 1248,
      nuevosClientes: 84,
      tasaConversion: "68.5%",
      ventasSemanales: weekSalesData,
      ventasMensuales: monthData,
      fecha: new Date().toLocaleDateString('es-AR')
    };
    
    console.log("Reporte generado:", reportData);
    
    // Mostrar notificación animada
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

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

      <div className="grid gap-6 lg:grid-cols-2 print:break-inside-avoid">
        <div className="rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-gray-300">
          <h2 className="mb-4 text-lg font-semibold text-foreground print:text-black">Ventas Semanales</h2>
          <SimpleBarChart data={weekSalesData} height={250} />
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-gray-300">
          <h2 className="mb-4 text-lg font-semibold text-foreground print:text-black">Ventas Mensuales</h2>
          <SimpleBarChart data={monthData} height={250} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 print:break-inside-avoid">
        <div className="rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-gray-300">
          <h3 className="mb-4 text-lg font-semibold text-foreground print:text-black">
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
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm print:break-inside-avoid print:border-gray-300">
          <h3 className="mb-4 text-lg font-semibold text-foreground print:text-black">
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
                className="flex items-center justify-between rounded-lg border bg-card p-4 print:border-gray-300"
              >
                <div>
                  <p className="font-medium text-foreground print:text-black">{cat.categoria}</p>
                  <p className="text-sm text-muted-foreground print:text-gray-600">{cat.ventas} unidades</p>
                </div>
                <span className="text-lg font-semibold text-foreground print:text-black">
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
