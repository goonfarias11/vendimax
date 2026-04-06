import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, hasAnyPermission, Permission, Role } from '@/lib/permissions'

type RoleAlias = Role | 'MANAGER' | 'CASHIER'
type AuthenticatedUser = {
  id: string
  role: string
  businessId?: string | null
}

function normalizeRole(role: string): RoleAlias {
  if (role === 'GERENTE') return 'MANAGER'
  if (role === 'VENDEDOR') return 'CASHIER'
  return role as RoleAlias
}

function normalizeRequiredRole(role: RoleAlias): RoleAlias {
  if (role === 'GERENTE') return 'MANAGER'
  if (role === 'VENDEDOR') return 'CASHIER'
  return role
}

// Middleware para verificar permisos
export async function requirePermission(
  request: NextRequest,
  permission: Permission | Permission[]
): Promise<{ authorized: boolean; user?: AuthenticatedUser; response?: NextResponse }> {
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

  const user: AuthenticatedUser = {
    id: session.user.id,
    role: session.user.role,
    businessId: session.user.businessId,
  }

  return { authorized: true, user }
}

// Helper para verificar roles específicos desde objeto de usuario
export function requireRole(
  user: { role?: string | null },
  allowedRoles: RoleAlias[]
): void {
  if (!user?.role) {
    const error = new Error('No autorizado') as Error & { status?: number }
    error.status = 401
    throw error
  }

  const currentRole = normalizeRole(user.role)
  const normalizedAllowedRoles = allowedRoles.map(normalizeRequiredRole)

  if (!normalizedAllowedRoles.includes(currentRole)) {
    const error = new Error('Forbidden') as Error & { status?: number }
    error.status = 403
    throw error
  }
}

// Wrapper opcional para validar roles desde request
export async function requireRoleFromRequest(
  request: NextRequest,
  allowedRoles: RoleAlias[]
): Promise<{ authorized: boolean; user?: AuthenticatedUser; response?: NextResponse }> {
  const session = await auth()

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  try {
    requireRole(session.user, allowedRoles)
    const user: AuthenticatedUser = {
      id: session.user.id,
      role: session.user.role,
      businessId: session.user.businessId,
    }

    return { authorized: true, user }
  } catch (error) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'No tienes permisos para acceder a este recurso' },
        { status: (error as Error & { status?: number }).status || 403 }
      )
    }
  }
}
