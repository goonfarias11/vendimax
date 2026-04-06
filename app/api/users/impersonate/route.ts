/**
 * POST /api/users/impersonate
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { hasAdminPanelAccess } from "@/lib/admin/access"
import { requireTenant } from "@/lib/security/tenant"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    if (!session?.user || !hasAdminPanelAccess(session.user.adminRole, session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId es requerido" }, { status: 400 })
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: userId, businessId: tenant },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminRole: true,
        businessId: true,
        isActive: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (!targetUser.isActive) {
      return NextResponse.json({ error: "No se puede impersonar un usuario inactivo" }, { status: 400 })
    }

    if (hasAdminPanelAccess(targetUser.adminRole, targetUser.role)) {
      return NextResponse.json({ error: "No se puede impersonar a otro administrador" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      impersonatedUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        adminRole: targetUser.adminRole,
        businessId: targetUser.businessId,
      },
      originalUser: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        adminRole: session.user.adminRole,
      },
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
