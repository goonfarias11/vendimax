"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, Edit3, Repeat } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface StockMovement {
  id: string;
  type: "ENTRADA" | "SALIDA" | "AJUSTE" | "TRANSFERENCIA";
  quantity: number;
  reason: string | null;
  reference: string | null;
  createdAt: string;
  product: {
    name: string;
    sku: string;
  };
  user: {
    name: string;
  };
}

export default function MovimientosStockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("TODOS");

  const [formData, setFormData] = useState({
    productId: "",
    type: "AJUSTE" as "ENTRADA" | "SALIDA" | "AJUSTE" | "TRANSFERENCIA",
    quantity: "",
    reason: "",
    reference: "",
  });

  useEffect(() => {
    loadMovements();
    loadProducts();
  }, []);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products/stock-movements?limit=100");
      if (!res.ok) throw new Error("Error al cargar movimientos");
      const data = await res.json();
      setMovements(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Error al cargar productos");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId || !formData.quantity) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    try {
      const payload = {
        productId: formData.productId,
        type: formData.type,
        quantity: parseInt(formData.quantity),
        reason: formData.reason || null,
        reference: formData.reference || null,
      };

      const res = await fetch("/api/products/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al registrar movimiento");
      }

      toast.success("Movimiento registrado exitosamente");
      setIsModalOpen(false);
      resetForm();
      loadMovements();
      loadProducts(); // Recargar para actualizar stock
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: "",
      type: "AJUSTE",
      quantity: "",
      reason: "",
      reference: "",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ENTRADA":
        return <ArrowDownCircle className="h-4 w-4 text-green-500" />;
      case "SALIDA":
        return <ArrowUpCircle className="h-4 w-4 text-red-500" />;
      case "AJUSTE":
        return <Edit3 className="h-4 w-4 text-blue-500" />;
      case "TRANSFERENCIA":
        return <Repeat className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      ENTRADA: "bg-green-100 text-green-800",
      SALIDA: "bg-red-100 text-red-800",
      AJUSTE: "bg-blue-100 text-blue-800",
      TRANSFERENCIA: "bg-purple-100 text-purple-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "TODOS" || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalEntradas = movements
    .filter((m) => m.type === "ENTRADA")
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalSalidas = movements
    .filter((m) => m.type === "SALIDA")
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalAjustes = movements.filter((m) => m.type === "AJUSTE").length;

  const selectedProduct = products.find((p) => p.id === formData.productId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Movimientos de Stock</h1>
          <p className="text-gray-600">Historial y registro de cambios en inventario</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/productos">Ver Productos</Link>
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Movimiento
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Movimientos</p>
              <p className="text-2xl font-bold text-gray-900">{movements.length}</p>
            </div>
            <Edit3 className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entradas</p>
              <p className="text-2xl font-bold text-green-600">{totalEntradas}</p>
            </div>
            <ArrowDownCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Salidas</p>
              <p className="text-2xl font-bold text-red-600">{totalSalidas}</p>
            </div>
            <ArrowUpCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ajustes</p>
              <p className="text-2xl font-bold text-blue-600">{totalAjustes}</p>
            </div>
            <Edit3 className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Card className="flex-1 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <Card className="p-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border-0 bg-transparent focus:outline-none focus:ring-0"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
            <option value="AJUSTE">Ajustes</option>
            <option value="TRANSFERENCIA">Transferencias</option>
          </select>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Referencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(movement.createdAt).toLocaleDateString()}{" "}
                      {new Date(movement.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{movement.product.name}</div>
                      <div className="text-sm text-gray-500">SKU: {movement.product.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getTypeBadge(movement.type)}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(movement.type)}
                          {movement.type}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          movement.type === "ENTRADA"
                            ? "text-green-600"
                            : movement.type === "SALIDA"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {movement.type === "ENTRADA" && "+"}
                        {movement.type === "SALIDA" && "-"}
                        {movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movement.reason || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {movement.reference || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{movement.user.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Registrar Movimiento */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="productId">Producto *</Label>
                <select
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  required
                >
                  <option value="">Seleccionar producto...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (SKU: {product.sku}) - Stock actual: {product.stock}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-900">
                    Stock actual: <span className="text-lg">{selectedProduct.stock}</span>
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="type">Tipo de Movimiento *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as "ENTRADA" | "SALIDA" | "AJUSTE" | "TRANSFERENCIA",
                    })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  required
                >
                  <option value="ENTRADA">Entrada (agregar stock)</option>
                  <option value="SALIDA">Salida (reducir stock)</option>
                  <option value="AJUSTE">Ajuste (establecer valor exacto)</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </div>

              <div>
                <Label htmlFor="quantity">
                  Cantidad * {formData.type === "AJUSTE" && "(valor final)"}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder={formData.type === "AJUSTE" ? "Ej: 100" : "Ej: 50"}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="reason">Motivo</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ej: Inventario físico, Merma, Devolución"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="reference">Referencia / Documento</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Ej: Remito #123, Orden #456"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Registrar Movimiento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
