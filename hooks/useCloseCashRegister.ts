"use client"

import { useState } from "react"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

// ============================================
// TIPOS
// ============================================

interface ClosingPreview {
  from: Date
  to: Date
  salesCount: number
  totals: {
    cash: number
    card: number
    transfer: number
    general: number
  }
}

interface LastClosing {
  id: string
  number: number
  from: Date
  to: Date
  totalGeneral: number
  responsibleName: string
  createdAt: Date
}

interface ClosingResult {
  id: string
  number: number
  from: Date
  to: Date
  totals: {
    cash: number
    card: number
    transfer: number
    general: number
  }
  closedBy: {
    id: string
    name: string
    email: string
  }
  salesCount: number
  summary: string
  createdAt: Date
}

interface UseCloseCashRegisterReturn {
  // Estado
  isLoading: boolean
  isLoadingPreview: boolean
  error: string | null
  preview: ClosingPreview | null
  lastClosing: LastClosing | null
  closingResult: ClosingResult | null

  // Métodos
  fetchPreview: () => Promise<void>
  closeCashRegister: (data: { notes?: string }) => Promise<ClosingResult | null>
  reset: () => void
}

// ============================================
// HOOK
// ============================================

export function useCloseCashRegister(): UseCloseCashRegisterReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ClosingPreview | null>(null)
  const [lastClosing, setLastClosing] = useState<LastClosing | null>(null)
  const [closingResult, setClosingResult] = useState<ClosingResult | null>(null)

  /**
   * Obtiene el preview del próximo cierre
   */
  const fetchPreview = async () => {
    try {
      setIsLoadingPreview(true)
      setError(null)

      const response = await fetch("/api/cash/close", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al obtener preview")
      }

      const data = await response.json()

      if (data.preview) {
        setPreview({
          from: new Date(data.preview.from),
          to: new Date(data.preview.to),
          salesCount: data.preview.salesCount,
          totals: data.preview.totals,
        })
      }

      if (data.lastClosing) {
        setLastClosing({
          ...data.lastClosing,
          from: new Date(data.lastClosing.from),
          to: new Date(data.lastClosing.to),
          createdAt: new Date(data.lastClosing.createdAt),
        })
      }

      logger.debug("Preview de cierre obtenido", {
        salesCount: data.preview?.salesCount,
      })
    } catch (err: any) {
      const errorMessage = err.message || "Error al cargar preview de cierre"
      setError(errorMessage)
      logger.error("Error en fetchPreview:", err)
      toast.error(errorMessage)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  /**
   * Ejecuta el cierre de caja
   */
  const closeCashRegister = async (data: {
    notes?: string
  }): Promise<ClosingResult | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/cash/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al cerrar caja")
      }

      const closingData: ClosingResult = {
        ...result.data,
        from: new Date(result.data.from),
        to: new Date(result.data.to),
        createdAt: new Date(result.data.createdAt),
      }

      setClosingResult(closingData)

      logger.info("Caja cerrada exitosamente", {
        number: closingData.number,
        totalGeneral: closingData.totals.general,
      })

      toast.success(`✅ Caja cerrada exitosamente - #${closingData.number}`, {
        description: `Total: $${closingData.totals.general.toLocaleString()}`,
      })

      return closingData
    } catch (err: any) {
      const errorMessage = err.message || "Error al cerrar caja"
      setError(errorMessage)
      logger.error("Error en closeCashRegister:", err)
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Resetea el estado del hook
   */
  const reset = () => {
    setError(null)
    setClosingResult(null)
    setPreview(null)
    setLastClosing(null)
  }

  return {
    isLoading,
    isLoadingPreview,
    error,
    preview,
    lastClosing,
    closingResult,
    fetchPreview,
    closeCashRegister,
    reset,
  }
}
