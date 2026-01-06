"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Alert {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  maxStock: number | null;
  unit: string;
  category: string | null;
  stockPercentage: number;
  severity: "critical" | "warning" | "low";
  missing: number;
  recommendedOrder: number;
}

interface Stats {
  total: number;
  critical: number;
  warning: number;
  outOfStock: number;
  totalMissingUnits: number;
}

export default function AlertasStockPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    critical: 0,
    warning: 0,
    outOfStock: 0,
    totalMissingUnits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("TODOS");

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products/stock/alerts");
      if (!res.ok) throw new Error("Error al cargar alertas");
      const data = await res.json();
      setAlerts(data.alerts);
      setStats(data.stats);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar alertas de stock");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "critical":
        return "Crítico";
      case "warning":
        return "Advertencia";
      default:
        return "Bajo";
    }
  };

  const filteredAlerts =
    filterSeverity === "TODOS"
      ? alerts
      : alerts.filter((a) => a.severity === filterSeverity.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertas de Stock</h1>
          <p className="text-gray-600">Productos que requieren reposición</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/inventario/movimientos">Ver Movimientos</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/compras">Nueva Compra</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alertas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Críticos</p>
              <p className="text-2xl font-bold text-red-900">{stats.critical}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Advertencias</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.warning}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sin Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
            </div>
            <Package className="h-8 w-8 text-gray-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            variant={filterSeverity === "TODOS" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterSeverity("TODOS")}
          >
            Todos ({stats.total})
          </Button>
          <Button
            variant={filterSeverity === "CRITICAL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterSeverity("CRITICAL")}
          >
            Críticos ({stats.critical})
          </Button>
          <Button
            variant={filterSeverity === "WARNING" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterSeverity("WARNING")}
          >
            Advertencias ({stats.warning})
          </Button>
        </div>
      </Card>

      {/* Alerta principal si hay productos sin stock */}
      {stats.outOfStock > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">
                ⚠️ Productos sin stock
              </h3>
              <p className="text-red-700 mb-3">
                Tienes {stats.outOfStock} producto{stats.outOfStock !== 1 ? "s" : ""} sin
                stock disponible. Se requiere acción inmediata.
              </p>
              <Button variant="destructive" size="sm" asChild>
                <Link href="/dashboard/compras">Crear Orden de Compra</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Alertas */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock Mínimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Faltante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  % Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Severidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ordenar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mb-3 text-green-500" />
                      <p className="text-lg font-medium text-gray-700">
                        ¡Todo en orden!
                      </p>
                      <p className="text-sm">No hay productos con stock bajo</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-gray-50 ${
                      alert.severity === "critical" ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{alert.name}</div>
                      <div className="text-sm text-gray-500">SKU: {alert.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {alert.category || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold ${
                          alert.stock === 0
                            ? "text-red-600"
                            : alert.severity === "critical"
                            ? "text-orange-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {alert.stock} {alert.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {alert.minStock} {alert.unit}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-red-600">
                        -{alert.missing} {alert.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              alert.stockPercentage < 50
                                ? "bg-red-500"
                                : alert.stockPercentage < 100
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(alert.stockPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {alert.stockPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {getSeverityText(alert.severity)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-blue-600">
                          {alert.recommendedOrder} {alert.unit}
                        </div>
                        <div className="text-xs text-gray-500">Sugerido</div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Resumen de Acción */}
      {stats.total > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <ShoppingCart className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-1">
                Resumen de Reposición
              </h3>
              <p className="text-blue-700 mb-3">
                Se requiere reponer un total de <strong>{stats.totalMissingUnits} unidades</strong>{" "}
                distribuidas en {stats.total} producto{stats.total !== 1 ? "s" : ""}.
              </p>
              <div className="flex gap-2">
                <Button size="sm" asChild>
                  <Link href="/dashboard/compras">Crear Orden de Compra</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/proveedores">Ver Proveedores</Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
