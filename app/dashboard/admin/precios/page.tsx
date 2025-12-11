"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatPrice } from '@/lib/mercadopago'

interface Plan {
  id: string
  name: string
  slug: string
  priceMonthly: number
  priceYearly: number
  setupFee: number
  isActive: boolean
  priceAdjustments: PriceAdjustment[]
}

interface Addon {
  id: string
  name: string
  slug: string
  priceMonthly: number
  isActive: boolean
  priceAdjustments: PriceAdjustment[]
}

interface PriceAdjustment {
  id: string
  previousPrice: number
  newPrice: number
  reason: string
  ipcValue: number | null
  createdAt: string
}

export default function AdminPreciosPage() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<Plan[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<'plan' | 'addon' | null>(null)
  const [newMonthlyPrice, setNewMonthlyPrice] = useState<number>(0)
  const [newYearlyPrice, setNewYearlyPrice] = useState<number>(0)
  const [reason, setReason] = useState<string>('')
  const [ipcValue, setIpcValue] = useState<number | null>(null)

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      window.location.href = '/dashboard'
      return
    }
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/precios')
      const data = await res.json()
      setPlans(data.plans || [])
      setAddons(data.addons || [])
      setLoading(false)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setLoading(false)
    }
  }

  const handleEdit = (id: string, type: 'plan' | 'addon') => {
    setEditingId(id)
    setEditingType(type)

    if (type === 'plan') {
      const plan = plans.find(p => p.id === id)
      if (plan) {
        setNewMonthlyPrice(Number(plan.priceMonthly))
        setNewYearlyPrice(Number(plan.priceYearly))
      }
    } else {
      const addon = addons.find(a => a.id === id)
      if (addon) {
        setNewMonthlyPrice(Number(addon.priceMonthly))
      }
    }

    setReason('')
    setIpcValue(null)
  }

  const handleSave = async () => {
    if (!editingId || !editingType || !reason) {
      alert('Completa todos los campos')
      return
    }

    try {
      const res = await fetch('/api/admin/precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editingType,
          targetId: editingId,
          newMonthlyPrice,
          newYearlyPrice: editingType === 'plan' ? newYearlyPrice : undefined,
          reason,
          ipcValue
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error al actualizar precio')
        return
      }

      alert('Precio actualizado correctamente')
      setEditingId(null)
      setEditingType(null)
      loadData()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar precio')
    }
  }

  const handleToggleActive = async (id: string, type: 'plan' | 'addon', currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/precios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          targetId: id,
          isActive: !currentActive
        })
      })

      if (!res.ok) {
        alert('Error al cambiar estado')
        return
      }

      loadData()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cambiar estado')
    }
  }

  const calculateYearlyDiscount = () => {
    if (newMonthlyPrice <= 0) return 0
    return newMonthlyPrice * 12 * 0.8 // 20% descuento
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestión de Precios</h1>

      {/* Planes */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Planes</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Mensual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Anual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setup Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-sm text-gray-500">{plan.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    {formatPrice(Number(plan.priceMonthly))}
                  </td>
                  <td className="px-6 py-4">
                    {formatPrice(Number(plan.priceYearly))}
                  </td>
                  <td className="px-6 py-4">
                    {formatPrice(Number(plan.setupFee))}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      plan.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {plan.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleEdit(plan.id, 'plan')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar Precio
                    </button>
                    <button
                      onClick={() => handleToggleActive(plan.id, 'plan', plan.isActive)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {plan.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Addons */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Addons</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Addon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Mensual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {addons.map(addon => (
                <tr key={addon.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{addon.name}</div>
                    <div className="text-sm text-gray-500">{addon.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    {formatPrice(Number(addon.priceMonthly))}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      addon.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {addon.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleEdit(addon.id, 'addon')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar Precio
                    </button>
                    <button
                      onClick={() => handleToggleActive(addon.id, 'addon', addon.isActive)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {addon.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              Actualizar Precio {editingType === 'plan' ? 'del Plan' : 'del Addon'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Precio Mensual (ARS)</label>
                <input
                  type="number"
                  value={newMonthlyPrice}
                  onChange={(e) => setNewMonthlyPrice(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {editingType === 'plan' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Anual (ARS)</label>
                  <input
                    type="number"
                    value={newYearlyPrice}
                    onChange={(e) => setNewYearlyPrice(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                  />
                  <button
                    onClick={() => setNewYearlyPrice(calculateYearlyDiscount())}
                    className="text-sm text-blue-600 hover:underline mt-1"
                  >
                    Calcular 20% descuento automático
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Motivo del Cambio</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Ajuste por IPC, Corrección de precio, etc."
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">% IPC (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ipcValue || ''}
                  onChange={(e) => setIpcValue(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Ej: 25.5"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setEditingId(null)
                    setEditingType(null)
                  }}
                  className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
