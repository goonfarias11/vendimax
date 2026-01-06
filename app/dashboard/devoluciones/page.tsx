"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeftCircle, Package, DollarSign, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Refund {
  id: string;
  type: "TOTAL" | "PARCIAL";
  reason: string;
  refundAmount: number;
  restockItems: boolean;
  notes: string | null;
  createdAt: string;
  sale: {
    ticketNumber: number | null;
    total: number;
    client: { name: string } | null;
  };
  user: {
    name: string;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    subtotal: number;
    product: {
      name: string;
      sku: string;
    };
  }[];
}

export default function DevolucionesPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [filterType, setFilterType] = useState<string>("TODOS");

  useEffect(() => {
    loadRefunds();
  }, [filterType]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== "TODOS") {
        params.set("type", filterType);
      }
      
      const res = await fetch(`/api/refunds?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar devoluciones");
      const data = await res.json();
      setRefunds(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar devoluciones");
    } finally {
      setLoading(false);
    }
  };

  const filteredRefunds = refunds;

  const totalRefunds = refunds.length;
  const totalAmount = refunds.reduce((sum, r) => sum + r.refundAmount, 0);
  const totalRefundsCount = refunds.filter((r) => r.type === "TOTAL").length;
  const parcialRefundsCount = refunds.filter((r) => r.type === "PARCIAL").length;

  const getTypeBadge = (type: string) => {
    return type === "TOTAL"
      ? "bg-red-100 text-red-800"
      : "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Devoluciones</h1>
          <p className="text-gray-600">Historial de reembolsos y devoluciones</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/ventas/historial">Ver Ventas</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Devoluciones</p>
              <p className="text-2xl font-bold text-gray-900">{totalRefunds}</p>
            </div>
            <ArrowLeftCircle className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monto Devuelto</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalAmount.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Devoluciones Totales</p>
              <p className="text-2xl font-bold text-red-600">{totalRefundsCount}</p>
            </div>
            <Package className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Devoluciones Parciales</p>
              <p className="text-2xl font-bold text-yellow-600">
                {parcialRefundsCount}
              </p>
            </div>
            <Package className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            variant={filterType === "TODOS" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("TODOS")}
          >
            Todas ({totalRefunds})
          </Button>
          <Button
            variant={filterType === "TOTAL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("TOTAL")}
          >
            Totales ({totalRefundsCount})
          </Button>
          <Button
            variant={filterType === "PARCIAL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("PARCIAL")}
          >
            Parciales ({parcialRefundsCount})
          </Button>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Monto Devuelto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Productos
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
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <ArrowLeftCircle className="h-12 w-12 mb-3 text-gray-400" />
                      <p className="text-lg font-medium text-gray-700">
                        No hay devoluciones registradas
                      </p>
                      <p className="text-sm">
                        Las devoluciones se procesan desde el historial de ventas
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(refund.createdAt).toLocaleDateString()}{" "}
                      {new Date(refund.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        #{refund.sale.ticketNumber || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total: ${refund.sale.total.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {refund.sale.client?.name || "Sin cliente"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getTypeBadge(refund.type)}>
                        {refund.type === "TOTAL" ? "Total" : "Parcial"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-red-600">
                        ${refund.refundAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {refund.items.length} item{refund.items.length !== 1 && "s"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {refund.user.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRefund(refund)}
                      >
                        Ver Detalle
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detalle */}
      <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de Devolución</DialogTitle>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4">
              {/* Información General */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(selectedRefund.createdAt).toLocaleDateString()}{" "}
                        {new Date(selectedRefund.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{selectedRefund.user.name}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Venta Original</div>
                    <div className="font-bold text-lg">
                      #{selectedRefund.sale.ticketNumber || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total: ${selectedRefund.sale.total.toLocaleString()}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Tipo y Monto */}
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Tipo de Devolución</div>
                    <Badge className={getTypeBadge(selectedRefund.type)}>
                      {selectedRefund.type === "TOTAL" ? "Total" : "Parcial"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Monto Devuelto</div>
                    <div className="text-2xl font-bold text-red-600">
                      ${selectedRefund.refundAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Motivo */}
              <Card className="p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Motivo</div>
                <p className="text-gray-900">{selectedRefund.reason}</p>
                {selectedRefund.notes && (
                  <>
                    <div className="text-sm font-medium text-gray-700 mt-3 mb-2">
                      Notas Adicionales
                    </div>
                    <p className="text-gray-600 text-sm">{selectedRefund.notes}</p>
                  </>
                )}
              </Card>

              {/* Productos Devueltos */}
              <Card className="p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">
                  Productos Devueltos
                </div>
                <div className="space-y-2">
                  {selectedRefund.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {item.quantity} x ${item.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          ${item.subtotal.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    {selectedRefund.restockItems ? (
                      <>
                        <Package className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-700">
                          Stock devuelto al inventario
                        </span>
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Stock no devuelto (productos dañados/no aptos)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRefund(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
