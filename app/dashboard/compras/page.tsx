"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ShoppingCart, Package, Trash2, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  cost: number;
  stock: number;
}

interface PurchaseItem {
  productId: string;
  product?: Product;
  quantity: number;
  cost: number;
  subtotal: number;
}

interface Purchase {
  id: string;
  supplier: Supplier;
  user: { name: string };
  invoiceNum: string | null;
  subtotal: number;
  tax: number;
  total: number;
  itemsCount: number;
  createdAt: string;
}

export default function ComprasPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [showProductResults, setShowProductResults] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: "",
    invoiceNum: "",
    notes: "",
    items: [] as PurchaseItem[],
  });

  useEffect(() => {
    loadPurchases();
    loadSuppliers();
    loadProducts();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/purchases");
      if (!res.ok) throw new Error("Error al cargar compras");
      const data = await res.json();
      setPurchases(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar compras");
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers?isActive=true");
      if (!res.ok) throw new Error("Error al cargar proveedores");
      const data = await res.json();
      setSuppliers(data);
    } catch (error) {
      console.error(error);
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

  const filteredProducts = products.filter(
    (p) =>
      searchProduct &&
      (p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchProduct.toLowerCase()))
  );

  const addProduct = (product: Product) => {
    const existing = formData.items.find((item) => item.productId === product.id);

    if (existing) {
      setFormData({
        ...formData,
        items: formData.items.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.cost,
              }
            : item
        ),
      });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            productId: product.id,
            product,
            quantity: 1,
            cost: product.cost,
            subtotal: product.cost,
          },
        ],
      });
    }

    setSearchProduct("");
    setShowProductResults(false);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }

    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity, subtotal: quantity * item.cost }
          : item
      ),
    });
  };

  const updateCost = (productId: string, cost: number) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.productId === productId
          ? { ...item, cost, subtotal: item.quantity * cost }
          : item
      ),
    });
  };

  const removeProduct = (productId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.productId !== productId),
    });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = 0; // IVA o impuesto si aplica
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId) {
      toast.error("Selecciona un proveedor");
      return;
    }

    if (formData.items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    try {
      const payload = {
        supplierId: formData.supplierId,
        invoiceNum: formData.invoiceNum || null,
        notes: formData.notes || null,
        items: formData.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          cost: item.cost,
          subtotal: item.subtotal,
        })),
        subtotal,
        tax,
        total,
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear compra");
      }

      toast.success("Compra registrada exitosamente");
      setIsModalOpen(false);
      resetForm();
      loadPurchases();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      supplierId: "",
      invoiceNum: "",
      notes: "",
      items: [],
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de anular esta compra? Se revertirá el stock.")) return;

    try {
      const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al anular compra");

      const result = await res.json();
      toast.success(result.message);
      loadPurchases();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totalCompras = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalProductos = purchases.reduce((sum, p) => sum + p.itemsCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600">Gestiona tus órdenes de compra</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/proveedores">Ver Proveedores</Link>
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Compra
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Compras</p>
              <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Gastado</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalCompras.toLocaleString()}
              </p>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Productos Comprados</p>
              <p className="text-2xl font-bold text-gray-900">{totalProductos}</p>
            </div>
            <Package className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar compra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

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
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Factura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
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
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No hay compras registradas
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{purchase.supplier.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {purchase.invoiceNum || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{purchase.itemsCount}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ${purchase.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{purchase.user.name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(purchase.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Nueva Compra */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Información General */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplierId">Proveedor *</Label>
                <select
                  id="supplierId"
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  required
                >
                  <option value="">Seleccionar proveedor...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="invoiceNum">Nº de Factura</Label>
                <Input
                  id="invoiceNum"
                  value={formData.invoiceNum}
                  onChange={(e) => setFormData({ ...formData, invoiceNum: e.target.value })}
                  placeholder="001-00123456"
                />
              </div>
            </div>

            {/* Buscar Productos */}
            <div>
              <Label htmlFor="searchProduct">Buscar Producto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="searchProduct"
                  value={searchProduct}
                  onChange={(e) => {
                    setSearchProduct(e.target.value);
                    setShowProductResults(true);
                  }}
                  placeholder="Buscar por nombre o SKU..."
                  className="pl-10"
                />

                {/* Resultados de búsqueda */}
                {showProductResults && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => addProduct(product)}
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.sku} | Costo: ${product.cost} | Stock: {product.stock}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Productos Agregados */}
            {formData.items.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Productos</h3>
                <div className="space-y-3">
                  {formData.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 border-b pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.product?.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.product?.sku}</div>
                      </div>

                      <div className="w-24">
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.productId, parseInt(e.target.value) || 0)
                          }
                          className="h-8"
                        />
                      </div>

                      <div className="w-32">
                        <Label className="text-xs">Costo Unit.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.cost}
                          onChange={(e) =>
                            updateCost(item.productId, parseFloat(e.target.value) || 0)
                          }
                          className="h-8"
                        />
                      </div>

                      <div className="w-28 text-right">
                        <Label className="text-xs">Subtotal</Label>
                        <div className="font-bold">${item.subtotal.toFixed(2)}</div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(item.productId)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div className="mt-4 pt-4 border-t space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Notas */}
            <div>
              <Label htmlFor="notes">Notas / Observaciones</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional..."
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
              />
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
              <Button type="submit" disabled={formData.items.length === 0}>
                Registrar Compra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
