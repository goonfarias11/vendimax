"use client"

import { useSession } from "next-auth/react"
import { hasPermission, hasAnyPermission, Permission, Role } from "@/lib/permissions"
import { ReactNode } from "react"

interface PermissionGuardProps {
  children: ReactNode
  permission?: Permission | Permission[]
  fallback?: ReactNode
  requireAll?: boolean // Para permissions array: true = AND, false = OR
}

export function PermissionGuard({ 
  children, 
  permission, 
  fallback = null,
  requireAll = false 
}: PermissionGuardProps) {
  const { data: session } = useSession()
  
  if (!session?.user?.role) {
    return <>{fallback}</>
  }

  const userRole = session.user.role as Role

  // Si no se especifica permiso, mostrar el contenido
  if (!permission) {
    return <>{children}</>
  }

  // Verificar permisos
  let hasAccess = false

  if (Array.isArray(permission)) {
    hasAccess = requireAll 
      ? permission.every(p => hasPermission(userRole, p))
      : hasAnyPermission(userRole, permission)
  } else {
    hasAccess = hasPermission(userRole, permission)
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// Hook personalizado para verificar permisos
export function usePermission(permission: Permission | Permission[], requireAll = false): boolean {
  const { data: session } = useSession()
  
  if (!session?.user?.role) {
    return false
  }

  const userRole = session.user.role as Role

  if (Array.isArray(permission)) {
    return requireAll 
      ? permission.every(p => hasPermission(userRole, p))
      : hasAnyPermission(userRole, permission)
  }

  return hasPermission(userRole, permission)
}

// Hook para obtener el rol actual
export function useRole(): Role | null {
  const { data: session } = useSession()
  return (session?.user?.role as Role) || null
}
