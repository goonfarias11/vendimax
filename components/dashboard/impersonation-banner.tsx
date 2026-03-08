"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImpersonationData {
  impersonatedUser: {
    id: string
    name: string
    email: string
    role: string
    businessId: string | null
  }
  originalUser: {
    id: string
    name: string
    email: string
    role: string
  }
}

export function ImpersonationBanner() {
  const { data: session, update } = useSession()
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Cargar datos de impersonation desde sessionStorage
    const stored = sessionStorage.getItem('impersonation')
    if (stored) {
      try {
        setImpersonationData(JSON.parse(stored))
      } catch (e) {
        sessionStorage.removeItem('impersonation')
      }
    }
  }, [])

  const handleStopImpersonation = async () => {
    setIsExiting(true)
    try {
      // Limpiar sessionStorage
      sessionStorage.removeItem('impersonation')
      
      // Llamar al endpoint para salir
      await fetch('/api/users/stop-impersonate', {
        method: 'POST'
      })

      // Recargar la página para volver a la sesión original
      window.location.href = '/dashboard/usuarios'
    } catch (error) {
      console.error('Error al salir de impersonation:', error)
      alert('Error al volver a tu cuenta. Recarga la página.')
    } finally {
      setIsExiting(false)
    }
  }

  if (!impersonationData) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold">Modo Administrador Activo</span>
            <span className="text-sm opacity-90">
              Estás viendo la cuenta de <strong>{impersonationData.impersonatedUser.name}</strong> ({impersonationData.impersonatedUser.email})
            </span>
          </div>
        </div>
        <Button
          onClick={handleStopImpersonation}
          disabled={isExiting}
          variant="outline"
          size="sm"
          className="bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-none flex-shrink-0"
        >
          {isExiting ? "Saliendo..." : "Volver a mi cuenta"}
        </Button>
      </div>
    </div>
  )
}
