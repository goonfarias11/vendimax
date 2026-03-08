"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useSession } from "next-auth/react"

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

interface ImpersonationContextType {
  impersonationData: ImpersonationData | null
  isImpersonating: boolean
  effectiveUser: {
    id: string
    name: string
    email: string
    role: string
    businessId: string | null
  } | null
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  impersonationData: null,
  isImpersonating: false,
  effectiveUser: null
})

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null)

  useEffect(() => {
    // Cargar datos de impersonación desde sessionStorage
    const stored = sessionStorage.getItem('impersonation')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setImpersonationData(data)
      } catch (e) {
        sessionStorage.removeItem('impersonation')
      }
    }

    // Escuchar cambios en sessionStorage (para actualizar en todas las pestañas)
    const handleStorageChange = () => {
      const stored = sessionStorage.getItem('impersonation')
      if (stored) {
        try {
          setImpersonationData(JSON.parse(stored))
        } catch (e) {
          setImpersonationData(null)
        }
      } else {
        setImpersonationData(null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Usuario efectivo: el usuario impersonado si está activo, o el usuario de sesión
  let effectiveUser: {
    id: string
    name: string
    email: string
    role: string
    businessId: string | null
  } | null = null

  if (impersonationData) {
    effectiveUser = impersonationData.impersonatedUser
  } else if (session?.user) {
    effectiveUser = {
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
      role: session.user.role,
      businessId: session.user.businessId || null
    }
  }

  return (
    <ImpersonationContext.Provider
      value={{
        impersonationData,
        isImpersonating: !!impersonationData,
        effectiveUser
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonationContext() {
  return useContext(ImpersonationContext)
}
