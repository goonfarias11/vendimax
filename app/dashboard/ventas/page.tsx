"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { Plus, Filter, Download, Printer } from "lucide-react";

type Sale = {
  saleId: string;
  id: string;
  cliente: string;
  fecha: string;
  items: number;
  total: number;
  metodoPago: string;
  estado: string;
}

const paymentMethodLabels: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA_DEBITO: "Tarjeta Debito",
  TARJETA_CREDITO: "Tarjeta Credito",
  TRANSFERENCIA: "Transferencia",
  QR: "QR",
  CUENTA_CORRIENTE: "Cuenta Corriente",
  OTRO: "Otro",
};

// Helper para renderizar números de forma segura
const safeNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export default function VentasPage() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const printTicket = (saleId: string) => {
    window.location.href = `/dashboard/ticket-preview/${saleId}`;
  }

  const handlePrintSale = async (saleId: string) => {
    printTicket(saleId);
  };

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
    {
      key: "acciones",
      header: "Acciones",
      cell: (row: Sale) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrintSale(row.saleId)}
          title="Imprimir ticket"
        >
          <Printer className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sales");
      
      if (!response.ok) throw new Error("Error al cargar ventas");
      
      const data = await response.json();
      
      // El API devuelve { sales: [...], pagination: {...} }
      const salesData = data.sales || data;
      
      // Formatear datos para la tabla
      const formattedSales: Sale[] = salesData.map((sale: any) => ({
        saleId: sale.id,
        id: sale.ticketNumber || sale.id.slice(0, 8),
        cliente: sale.client?.name || "Sin cliente",
        fecha: new Date(sale.createdAt).toLocaleString("es-AR"),
        items: sale.itemsCount || sale.saleItems?.length || 0,
        total: sale.total,
        metodoPago: formatPaymentMethod(sale.paymentMethod),
        estado: sale.status === 'COMPLETADO' ? "Completado" : sale.status || "Pendiente"
      }));
      
      setSales(formattedSales);
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      alert("Error al cargar ventas");
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
            ${sales.filter(s => s.estado === 'Completado').reduce((sum, s) => sum + s.total, 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Transacciones</p>
          <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Ticket Promedio</p>
          <p className="text-2xl font-bold text-gray-900">
            ${sales.filter(s => s.estado === 'Completado').length > 0 ? safeNumber(sales.filter(s => s.estado === 'Completado').reduce((sum, s) => sum + safeNumber(s.total), 0) / sales.filter(s => s.estado === 'Completado').length).toFixed(0) : '0'}
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}


