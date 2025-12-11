"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dashboard/data-table";
import { Modal } from "@/components/dashboard/modal";
import { Plus, Filter, AlertCircle } from "lucide-react";
import { mockProducts } from "@/lib/mock-data";

export default function InventarioPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("Todos");

  const columns = [
    { key: "sku", header: "SKU" },
    { key: "nombre", header: "Producto" },
    { key: "categoria", header: "Categoría" },
    {
      key: "precio",
      header: "Precio",
      cell: (row: any) => `$${row.precio.toLocaleString()}`,
    },
    {
      key: "stock",
      header: "Stock",
      cell: (row: any) => (
        <span className={row.stock < 10 ? "text-red-600 font-semibold" : ""}>
          {row.stock}
        </span>
      ),
    },
    { key: "vendidos", header: "Vendidos" },
    {
      key: "estado",
      header: "Estado",
      cell: (row: any) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            row.estado === "Activo"
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {row.estado}
        </span>
      ),
    },
  ];

  const filteredData =
    filterCategory === "Todos"
      ? mockProducts
      : mockProducts.filter((p) => p.categoria === filterCategory);

  const lowStockProducts = mockProducts.filter((p) => p.stock < 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Gestiona tus productos y stock</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Alert */}
      {lowStockProducts.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <p className="text-sm text-orange-800">
            {lowStockProducts.length} producto(s) con stock bajo
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option>Todos</option>
            <option>Electrónica</option>
            <option>Accesorios</option>
            <option>Audio</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Total Productos</p>
          <p className="text-2xl font-bold text-gray-900">{mockProducts.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Valor Inventario</p>
          <p className="text-2xl font-bold text-gray-900">
            ${mockProducts.reduce((sum, p) => sum + p.precio * p.stock, 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Stock Total</p>
          <p className="text-2xl font-bold text-gray-900">
            {mockProducts.reduce((sum, p) => sum + p.stock, 0)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Bajo Stock</p>
          <p className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</p>
        </div>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredData} />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Producto"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Ej: Mouse Logitech"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Ej: MS-LOG-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <option>Seleccionar...</option>
                <option>Electrónica</option>
                <option>Accesorios</option>
                <option>Audio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Inicial
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Guardar Producto</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
