import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { requirePermission, requireRole } from "@/lib/auth-middleware"
import { Prisma } from "@prisma/client"
import { requireTenant } from "@/lib/security/tenant"
import { updateUserSchema } from "@/lib/validation/user.schema"

export const runtime = "nodejs"

// GET: Obtener detalles de usuario
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const permissionCheck = await requirePermission(request, "users:view")
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const user = await prisma.user.findFirst({
      where: {
        id,
        businessId: tenant,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        sales: {
          where: { businessId: tenant },
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH: Actualizar usuario
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const permissionCheck = await requirePermission(request, "users:edit")
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    requireRole(session!.user, ["ADMIN", "OWNER"])

    const parsed = updateUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { id, businessId: tenant },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.role !== undefined && { role: parsed.data.role }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Desactivar usuario
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const permissionCheck = await requirePermission(request, "users:delete")
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    requireRole(session!.user, ["ADMIN", "OWNER"])

    const user = await prisma.user.findFirst({
      where: { id, businessId: tenant },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
