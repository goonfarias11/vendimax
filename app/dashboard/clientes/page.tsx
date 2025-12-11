"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { Modal } from "@/components/dashboard/modal";
import { Plus, Mail, Phone } from "lucide-react";
import { mockClientes } from "@/lib/mock-data";

export default function ClientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { key: "id", header: "ID" },
    { key: "nombre", header: "Nombre" },
    {
      key: "email",
      header: "Email",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span>{row.email}</span>
        </div>
      ),
    },
    {
      key: "telefono",
      header: "Teléfono",
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span>{row.telefono}</span>
        </div>
      ),
    },
    { key: "compras", header: "Compras" },
    {
      key: "totalGastado",
      header: "Total Gastado",
      cell: (row: any) => `$${row.totalGastado.toLocaleString()}`,
    },
    { key: "ultimaCompra", header: "Última Compra" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona tu base de clientes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Total Clientes</p>
          <p className="text-2xl font-bold text-gray-900">{mockClientes.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Ticket Promedio</p>
          <p className="text-2xl font-bold text-gray-900">
            $
            {(
              mockClientes.reduce((sum, c) => sum + c.totalGastado, 0) /
              mockClientes.reduce((sum, c) => sum + c.compras, 0)
            ).toFixed(0)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Total Facturado</p>
          <p className="text-2xl font-bold text-gray-900">
            ${mockClientes.reduce((sum, c) => sum + c.totalGastado, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <DataTable columns={columns} data={mockClientes} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Cliente"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="juan@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="+54 9 11 1234-5678"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Guardar Cliente</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
