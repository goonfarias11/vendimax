import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { ZodError } from "zod"
import { requireTenant } from "@/lib/security/tenant"
import { supplierSchema } from "@/lib/validation/supplier.schema"

// GET /api/suppliers/[id] - Obtener detalle de proveedor
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant
    const { id } = await params

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        businessId: tenant,
      },
      include: {
        purchases: {
          where: { businessId: tenant },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            purchaseItems: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    const totalPurchased = supplier.purchases.reduce((sum, p) => sum + Number(p.total), 0)

    const formattedSupplier = {
      ...supplier,
      totalPurchased,
      purchases: supplier.purchases.map((p) => ({
        ...p,
        total: Number(p.total),
        subtotal: Number(p.subtotal),
        tax: Number(p.tax),
        purchaseItems: p.purchaseItems.map((item) => ({
          ...item,
          cost: Number(item.cost),
          subtotal: Number(item.subtotal),
        })),
      })),
    }

    return NextResponse.json(formattedSupplier)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/suppliers/[id] - Actualizar proveedor
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant
    const { id } = await params

    const body = await request.json()
    const validatedData = supplierSchema.partial().parse(body)

    const existing = await prisma.supplier.findFirst({
      where: { businessId: tenant, id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    if (validatedData.email && validatedData.email !== existing.email) {
      const emailExists = await prisma.supplier.findFirst({
        where: { businessId: tenant, email: validatedData.email },
      })

      if (emailExists) {
        return NextResponse.json({ error: "Ya existe un proveedor con ese email" }, { status: 400 })
      }
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: validatedData,
    })

    logger.info("Proveedor actualizado", { supplierId: id, userId: session!.user.id })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }

    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/suppliers/[id] - Eliminar/desactivar proveedor
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant
    const { id } = await params

    const supplier = await prisma.supplier.findFirst({
      where: { businessId: tenant, id },
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    if (supplier._count.purchases > 0) {
      const updated = await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      })

      logger.info("Proveedor desactivado", { supplierId: id, userId: session!.user.id })

      return NextResponse.json({
        message: "Proveedor desactivado",
        supplier: updated,
      })
    }

    await prisma.supplier.delete({
      where: { id },
    })

    logger.info("Proveedor eliminado", { supplierId: id, userId: session!.user.id })

    return NextResponse.json({ message: "Proveedor eliminado" })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
