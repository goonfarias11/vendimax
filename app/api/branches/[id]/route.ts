/**
 * API para gestionar una sucursal específica
 * PUT /api/branches/[id]
 * DELETE /api/branches/[id]
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"
import { branchUpdateSchema } from "@/lib/validation/branch.schema"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    if (session!.user.role !== "ADMIN" && session!.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parsed = branchUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 })
    }
    const { name, address, phone, isActive, isMain } = parsed.data

    const branch = await prisma.branch.findFirst({
      where: { id, businessId: tenant },
    })

    if (!branch) {
      return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isMain) {
        await tx.branch.updateMany({
          where: {
            businessId: tenant,
            isMain: true,
            id: { not: id },
          },
          data: { isMain: false },
        })
      }

      return tx.branch.update({
        where: { id, businessId: tenant },
        data: {
          ...(name !== undefined && { name }),
          ...(address !== undefined && { address }),
          ...(phone !== undefined && { phone }),
          ...(typeof isActive === "boolean" && { isActive }),
          ...(typeof isMain === "boolean" && { isMain }),
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    if (session!.user.role !== "ADMIN" && session!.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const branch = await prisma.branch.findFirst({
      where: { id, businessId: tenant },
    })

    if (!branch) {
      return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 })
    }

    const salesCount = await prisma.sale.count({
      where: { branchId: id, businessId: tenant },
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una sucursal con ventas asociadas" },
        { status: 400 },
      )
    }

    if (branch.isMain) {
      return NextResponse.json(
        { error: "No se puede eliminar la sucursal principal" },
        { status: 400 },
      )
    }

    await prisma.branch.delete({
      where: { id, businessId: tenant },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
