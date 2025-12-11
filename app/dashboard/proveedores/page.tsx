"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { Modal } from "@/components/dashboard/modal";
import { Plus } from "lucide-react";
import { mockProveedores } from "@/lib/mock-data";

export default function ProveedoresPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { key: "id", header: "ID" },
    { key: "nombre", header: "Nombre" },
    { key: "contacto", header: "Contacto" },
    { key: "email", header: "Email" },
    { key: "telefono", header: "Teléfono" },
    { key: "productos", header: "Productos" },
    { key: "ultimoPedido", header: "Último Pedido" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600">Gestiona tus proveedores</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Total Proveedores</p>
          <p className="text-2xl font-bold text-gray-900">{mockProveedores.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Productos Suministrados</p>
          <p className="text-2xl font-bold text-gray-900">
            {mockProveedores.reduce((sum, p) => sum + p.productos, 0)}
          </p>
        </div>
      </div>

      <DataTable columns={columns} data={mockProveedores} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Proveedor"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Guardar Proveedor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
