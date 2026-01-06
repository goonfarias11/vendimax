"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, TrendingUp, TrendingDown, Activity } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  category?: {
    name: string;
  };
}

interface StockStats {
  totalProducts: number;
  totalValue: number;
  totalStock: number;
  lowStockCount: number;
}

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StockStats>({
    totalProducts: 0,
    totalValue: 0,
    totalStock: 0,
    lowStockCount: 0,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Error al cargar productos");
      const data = await res.json();
      setProducts(data);
      
      // Calcular estadísticas
      const totalProducts = data.length;
      const totalValue = data.reduce((sum: number, p: Product) => sum + (p.price * p.stock), 0);
      const totalStock = data.reduce((sum: number, p: Product) => sum + p.stock, 0);
      const lowStockCount = data.filter((p: Product) => p.stock <= p.minStock).length;
      
      setStats({
        totalProducts,
        totalValue,
        totalStock,
        lowStockCount,
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = products
    .filter((p) => p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
          <p className="text-gray-600">Control y monitoreo de stock</p>
        </div>
      </div>

      {/* Alert de stock bajo */}
      {stats.lowStockCount > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">
                ⚠️ Alerta de Stock Bajo
              </h3>
              <p className="text-red-700 mb-3">
                Tienes {stats.lowStockCount} producto{stats.lowStockCount !== 1 ? "s" : ""} con
                stock por debajo del mínimo configurado.
              </p>
              <Button variant="destructive" size="sm" asChild>
                <Link href="/dashboard/inventario/alertas">Ver Alertas</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <Package className="h-10 w-10 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor del Inventario</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalValue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStock}</p>
            </div>
            <Activity className="h-10 w-10 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStockCount}</p>
            </div>
            <TrendingDown className="h-10 w-10 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/dashboard/inventario/movimientos" className="flex flex-col items-center gap-2">
              <Activity className="h-6 w-6" />
              <div>
                <div className="font-semibold">Movimientos de Stock</div>
                <div className="text-xs text-gray-500">Historial y ajustes</div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/dashboard/inventario/alertas" className="flex flex-col items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <div className="font-semibold">Alertas de Stock</div>
                <div className="text-xs text-gray-500">Productos por reponer</div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto py-4">
            <Link href="/dashboard/productos" className="flex flex-col items-center gap-2">
              <Package className="h-6 w-6" />
              <div>
                <div className="font-semibold">Gestionar Productos</div>
                <div className="text-xs text-gray-500">CRUD completo</div>
              </div>
            </Link>
          </Button>
        </div>
      </Card>

      {/* Productos con Stock Bajo */}
      {lowStockProducts.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Productos con Stock Bajo (Top 10)
            </h2>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/inventario/alertas">Ver Todas</Link>
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock Actual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock Mínimo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.category?.name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-red-600">{product.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.minStock}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        {product.stock === 0 ? "Sin Stock" : "Crítico"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Sin productos con stock bajo */}
      {!loading && lowStockProducts.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Package className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Todo en orden!
            </h3>
            <p className="text-gray-600 max-w-md">
              No hay productos con stock por debajo del mínimo. Tu inventario está bien gestionado.
            </p>
            <div className="flex gap-3 mt-6">
              <Button asChild>
                <Link href="/dashboard/productos">Ver Productos</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/inventario/movimientos">Ver Movimientos</Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
