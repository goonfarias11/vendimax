import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, hasAnyPermission, Permission, Role } from '@/lib/permissions'

// Middleware para verificar permisos
export async function requirePermission(
  request: NextRequest,
  permission: Permission | Permission[]
): Promise<{ authorized: boolean; user?: any; response?: NextResponse }> {
  const session = await auth()

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const userRole = session.user.role as Role

  // Verificar permiso único o múltiple
  const hasAccess = Array.isArray(permission)
    ? hasAnyPermission(userRole, permission)
    : hasPermission(userRole, permission)

  if (!hasAccess) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }
  }

  return { authorized: true, user: session.user }
}

// Middleware para verificar roles específicos
export async function requireRole(
  request: NextRequest,
  allowedRoles: Role[]
): Promise<{ authorized: boolean; user?: any; response?: NextResponse }> {
  const session = await auth()

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const userRole = session.user.role as Role

  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'No tienes permisos para acceder a este recurso' },
        { status: 403 }
      )
    }
  }

  return { authorized: true, user: session.user }
}
