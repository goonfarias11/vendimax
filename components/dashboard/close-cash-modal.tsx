"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CloseCashModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number, description: string) => Promise<void>
  currentBalance: number
}

export function CloseCashModal({ isOpen, onClose, onConfirm, currentBalance }: CloseCashModalProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onConfirm(Number(amount), description)
      setAmount("")
      setDescription("")
      onClose()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const difference = Number(amount) - currentBalance

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-bold text-gray-900">Cerrar Caja</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Balance del Sistema */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 mb-1">Balance del Sistema</p>
            <p className="text-2xl font-bold text-blue-900">
              ${currentBalance.toLocaleString()}
            </p>
          </div>

          {/* Monto Físico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Físico en Caja *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="Ingresa el monto contado"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Diferencia */}
          {amount && (
            <div className={`rounded-lg p-4 ${
              difference === 0 
                ? "bg-green-50 border border-green-200" 
                : difference > 0 
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-red-50 border border-red-200"
            }`}>
              <p className="text-sm mb-1 font-medium">
                {difference === 0 ? "✅ Cuadra perfecto" : "⚠️ Diferencia"}
              </p>
              <p className={`text-xl font-bold ${
                difference === 0 
                  ? "text-green-700" 
                  : difference > 0 
                  ? "text-yellow-700"
                  : "text-red-700"
              }`}>
                {difference > 0 ? "+" : ""}${Math.abs(difference).toLocaleString()}
              </p>
              {difference !== 0 && (
                <p className="text-sm mt-1 text-gray-600">
                  {difference > 0 ? "Sobrante" : "Faltante"}
                </p>
              )}
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Agrega cualquier observación (opcional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Cerrando..." : "Cerrar Caja"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
