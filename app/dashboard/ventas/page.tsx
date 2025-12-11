"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { Plus, Filter, Download } from "lucide-react";

type Sale = {
  id: string;
  cliente: string;
  fecha: string;
  items: number;
  total: number;
  metodoPago: string;
  estado: string;
}

export default function VentasPage() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { key: "id", header: "ID" },
    { key: "cliente", header: "Cliente" },
    { key: "fecha", header: "Fecha y Hora" },
    { key: "items", header: "Items" },
    {
      key: "total",
      header: "Total",
      cell: (row: any) => `$${row.total.toLocaleString()}`,
    },
    { key: "metodoPago", header: "Método de Pago" },
    {
      key: "estado",
      header: "Estado",
      cell: (row: any) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            row.estado === "Completado"
              ? "bg-green-100 text-green-700"
              : row.estado === "Pendiente"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.estado}
        </span>
      ),
    },
  ];

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      console.log("Cargando ventas...");
      const response = await fetch("/api/sales");
      console.log("Response status:", response.status);
      
      if (!response.ok) throw new Error("Error al cargar ventas");
      
      const data = await response.json();
      console.log("Ventas recibidas:", data);
      
      // Formatear datos para la tabla
      const formattedSales: Sale[] = data.map((sale: any) => ({
        id: sale.number || sale.id.slice(0, 8),
        cliente: sale.client?.name || "Sin cliente",
        fecha: new Date(sale.createdAt).toLocaleString("es-AR"),
        items: sale.saleItems?.length || 0,
        total: sale.total,
        metodoPago: formatPaymentMethod(sale.paymentMethod),
        estado: sale.cashClosingId ? "Cerrado" : "Abierto"
      }));
      
      console.log("Ventas formateadas:", formattedSales);
      setSales(formattedSales);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar ventas: " + error);
    } finally {
      setLoading(false);
    }
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      EFECTIVO: "Efectivo",
      TARJETA_DEBITO: "Tarjeta Débito",
      TARJETA_CREDITO: "Tarjeta Crédito",
      TRANSFERENCIA: "Transferencia",
      QR: "QR",
      OTRO: "Otro"
    };
    return methods[method] || method;
  };

  const filteredData =
    filterStatus === "Todos"
      ? sales
      : sales.filter((sale) => sale.estado === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando ventas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600">Gestiona todas tus ventas</p>
        </div>
        <Button onClick={() => router.push("/dashboard/ventas/nueva")}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Venta
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option>Todos</option>
            <option>Abierto</option>
            <option>Cerrado</option>
          </select>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Total Ventas</p>
          <p className="text-2xl font-bold text-gray-900">
            ${sales.reduce((sum, s) => sum + s.total, 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Transacciones</p>
          <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Ticket Promedio</p>
          <p className="text-2xl font-bold text-gray-900">
            ${sales.length > 0 ? (sales.reduce((sum, s) => sum + s.total, 0) / sales.length).toFixed(0) : '0'}
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
