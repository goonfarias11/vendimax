import { NextResponse } from "next/server"
import type { Session } from "next-auth"
import { auth } from "@/lib/auth"
import { hasAdminPanelAccess, isSuperAdmin } from "@/lib/admin/access"

type AuthSession = Session

type AdminApiAuthResult =
  | {
      authorized: true
      session: AuthSession
    }
  | {
      authorized: false
      response: NextResponse
    }

export async function requireAdminApiSession(): Promise<AdminApiAuthResult> {
  const session = await auth()

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    }
  }

  if (!hasAdminPanelAccess(session.user.adminRole, session.user.role)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    }
  }

  return {
    authorized: true,
    session,
  }
}

export async function requireSuperAdminApiSession(): Promise<AdminApiAuthResult> {
  const authResult = await requireAdminApiSession()

  if (!authResult.authorized) {
    return authResult
  }

  if (!isSuperAdmin(authResult.session.user.adminRole, authResult.session.user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Se requiere permiso de super admin" },
        { status: 403 }
      ),
    }
  }

  return authResult
}
