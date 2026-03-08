"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"

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

export function useImpersonation() {
  const { data: session, update } = useSession()
  const [isImpersonating, setIsImpersonating] = useState(false)

  const startImpersonation = async (userId: string) => {
    try {
      const response = await fetch('/api/users/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al iniciar impersonación')
      }

      const data: ImpersonationData = await response.json()

      // Guardar datos de impersonación en sessionStorage
      sessionStorage.setItem('impersonation', JSON.stringify(data))
      
      setIsImpersonating(true)

      // Recargar la página para aplicar la nueva sesión
      window.location.href = '/dashboard'

      return { success: true, data }
    } catch (error) {
      console.error('Error en startImpersonation:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }
    }
  }

  const stopImpersonation = async () => {
    try {
      // Limpiar sessionStorage
      sessionStorage.removeItem('impersonation')

      // Llamar al endpoint
      await fetch('/api/users/stop-impersonate', {
        method: 'POST'
      })

      setIsImpersonating(false)

      // Recargar para restaurar sesión original
      window.location.href = '/dashboard/usuarios'

      return { success: true }
    } catch (error) {
      console.error('Error en stopImpersonation:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }
    }
  }

  const getImpersonationData = (): ImpersonationData | null => {
    if (typeof window === 'undefined') return null
    
    const stored = sessionStorage.getItem('impersonation')
    if (!stored) return null

    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  return {
    isImpersonating,
    startImpersonation,
    stopImpersonation,
    getImpersonationData,
    isAdmin: session?.user?.role === 'ADMIN'
  }
}
