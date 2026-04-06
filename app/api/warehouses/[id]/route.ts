/**
 * API para gestionar un depósito específico
 * PUT /api/warehouses/[id]
 * DELETE /api/warehouses/[id]
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"
import { warehouseUpdateSchema } from "@/lib/validation/warehouse.schema"

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

    const parsed = warehouseUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: { id, branch: { businessId: tenant } },
      include: { branch: true },
    })

    if (!warehouse) {
      return NextResponse.json({ error: "Depósito no encontrado" }, { status: 404 })
    }

    const { name, address, isActive, isMain } = parsed.data

    const updated = await prisma.$transaction(async (tx) => {
      if (isMain) {
        await tx.warehouse.updateMany({
          where: {
            branchId: warehouse.branchId,
            isMain: true,
            id: { not: id },
          },
          data: { isMain: false },
        })
      }

      return tx.warehouse.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(address !== undefined && { address }),
          ...(typeof isActive === "boolean" && { isActive }),
          ...(typeof isMain === "boolean" && { isMain }),
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
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

    const warehouse = await prisma.warehouse.findFirst({
      where: { id, branch: { businessId: tenant } },
      include: {
        _count: {
          select: { sales: true, productStocks: true },
        },
      },
    })

    if (!warehouse) {
      return NextResponse.json({ error: "Depósito no encontrado" }, { status: 404 })
    }

    if (warehouse._count.sales > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un depósito con ventas asociadas" },
        { status: 400 },
      )
    }

    await prisma.warehouse.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
