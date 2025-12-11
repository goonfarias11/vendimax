"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCloseCashRegister } from "@/hooks/useCloseCashRegister"
import {
  DollarSign,
  CreditCard,
  ArrowRightLeft,
  TrendingUp,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { formatCurrency } from "@/lib/cashClosing"

// ============================================
// TIPOS
// ============================================

interface CloseCashRegisterDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

// ============================================
// COMPONENTE
// ============================================

export function CloseCashRegisterDialog({
  isOpen,
  onClose,
  onSuccess,
}: CloseCashRegisterDialogProps) {
  const {
    isLoading,
    isLoadingPreview,
    error,
    preview,
    lastClosing,
    closingResult,
    fetchPreview,
    closeCashRegister,
    reset,
  } = useCloseCashRegister()

  const [notes, setNotes] = useState("")

  // Cargar preview cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      fetchPreview()
      setNotes("")
      reset()
    }
  }, [isOpen])

  // Manejar cierre
  const handleClose = async () => {
    const result = await closeCashRegister({ notes: notes.trim() || undefined })

    if (result) {
      setTimeout(() => {
        onClose()
        onSuccess?.()
      }, 2000)
    }
  }

  // Manejar cancelar
  const handleCancel = () => {
    setNotes("")
    reset()
    onClose()
  }

  // Si ya se cerró exitosamente
  if (closingResult) {
    return (
      <Dialog open={isOpen} onOpenChange={handleCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <DialogTitle>¡Caja Cerrada Exitosamente!</DialogTitle>
            </div>
            <DialogDescription>
              El cierre de caja se ha registrado correctamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Número de cierre */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-medium">Cierre de Caja</p>
              <p className="text-3xl font-bold text-green-900">
                #{String(closingResult.number).padStart(6, "0")}
              </p>
            </div>

            {/* Totales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Efectivo</span>
                </div>
                <p className="text-xl font-bold">
                  ${closingResult.totals.cash.toLocaleString()}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">Tarjeta</span>
                </div>
                <p className="text-xl font-bold">
                  ${closingResult.totals.card.toLocaleString()}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  <span className="text-sm">Transferencia</span>
                </div>
                <p className="text-xl font-bold">
                  ${closingResult.totals.transfer.toLocaleString()}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Total General</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  ${closingResult.totals.general.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Info adicional */}
            <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Ventas procesadas: {closingResult.salesCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Cerrado por: {closingResult.closedBy.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(closingResult.createdAt).toLocaleString("es-AR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCancel} className="w-full">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cerrar Caja</DialogTitle>
          <DialogDescription>
            Registra el cierre de caja del día. Revisa los totales antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Loading preview */}
          {isLoadingPreview && (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Calculando totales...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && !isLoadingPreview && (
            <>
              {/* Último cierre */}
              {lastClosing && (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Último cierre</p>
                  <p className="font-semibold text-gray-900">
                    #{String(lastClosing.number).padStart(6, "0")} -{" "}
                    {new Date(lastClosing.to).toLocaleDateString("es-AR")}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: ${lastClosing.totalGeneral.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Período */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Período del cierre</span>
                </div>
                <p className="text-sm text-gray-600">
                  Desde:{" "}
                  {new Date(preview.from).toLocaleString("es-AR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  Hasta:{" "}
                  {new Date(preview.to).toLocaleString("es-AR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>

              {/* Resumen de ventas */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-700 mb-3">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Resumen de ventas</span>
                </div>
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-blue-600">{preview.salesCount}</p>
                  <p className="text-sm text-gray-600">ventas completadas</p>
                </div>
              </div>

              {/* Totales por método de pago */}
              <div className="space-y-3">
                <p className="font-medium text-gray-900">Totales por método de pago</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Efectivo</span>
                    </div>
                    <p className="text-xl font-bold">
                      ${preview.totals.cash.toLocaleString()}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">Tarjeta</span>
                    </div>
                    <p className="text-xl font-bold">
                      ${preview.totals.card.toLocaleString()}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <ArrowRightLeft className="h-4 w-4" />
                      <span className="text-sm">Transferencia</span>
                    </div>
                    <p className="text-xl font-bold">
                      ${preview.totals.transfer.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">Total General</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      ${preview.totals.general.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observaciones (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agrega cualquier observación relevante del cierre..."
                  rows={3}
                  maxLength={500}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">{notes.length}/500 caracteres</p>
              </div>

              {/* Advertencia */}
              {preview.salesCount === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Sin ventas para cerrar</p>
                    <p className="text-sm text-yellow-700">
                      No hay ventas completadas en el período especificado.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleClose}
            disabled={isLoading || isLoadingPreview || !preview || preview.salesCount === 0}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Cerrando..." : "Cerrar Caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
