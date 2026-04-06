import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { requirePermission, requireRole } from "@/lib/auth-middleware"
import { z } from "zod"
import { requireTenant } from "@/lib/security/tenant"

export const runtime = "nodejs"

const cancelSaleSchema = z.object({
  reason: z.string().min(10, "El motivo debe tener al menos 10 caracteres"),
})

// GET: Obtener detalle de venta
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const permissionCheck = await requirePermission(request, "pos:access")
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const where: Prisma.SaleWhereInput = {
      id,
      businessId: tenant,
    }

    if (session!.user.role === "VENDEDOR") {
      where.userId = session!.user.id
    }

    const sale = await prisma.sale.findFirst({
      where,
      include: {
        saleItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                cost: true,
                businessId: true,
              },
            },
          },
        },
        salePayments: {
          select: {
            id: true,
            paymentMethod: true,
            amount: true,
            reference: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            businessId: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    if (sale.businessId !== tenant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (session!.user.role === "VENDEDOR") {
      const sanitizedSale = {
        ...sale,
        saleItems: sale.saleItems.map((item) => ({
          ...item,
          product: {
            ...item.product,
            cost: new Prisma.Decimal(0),
          },
        })),
      }
      return NextResponse.json(sanitizedSale)
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: Anular venta
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const permissionCheck = await requirePermission(request, "pos:cancel_sale")
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    requireRole(session!.user, ["OWNER", "ADMIN", "MANAGER"])

    const body = await request.json()
    const parsed = cancelSaleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 })
    }
    const { reason } = parsed.data

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        businessId: tenant,
      },
      include: {
        saleItems: {
          include: {
            product: true,
          },
        },
        client: true,
      },
    })

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    if (sale.status === "CANCELADO") {
      return NextResponse.json({ error: "La venta ya está cancelada" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const canceledSale = await tx.sale.update({
        where: { id },
        data: {
          status: "CANCELADO",
          updatedAt: new Date(),
        },
      })

      let mainBranch = await tx.branch.findFirst({
        where: {
          businessId: tenant,
          isMain: true,
          isActive: true,
        },
      })

      if (!mainBranch) {
        mainBranch = await tx.branch.findFirst({
          where: {
            businessId: tenant,
            isActive: true,
          },
        })
      }

      let mainWarehouse =
        mainBranch &&
        (await tx.warehouse.findFirst({
          where: {
            branchId: mainBranch.id,
            isMain: true,
            isActive: true,
          },
        }))

      if (!mainWarehouse && mainBranch) {
        mainWarehouse = await tx.warehouse.findFirst({
          where: {
            branchId: mainBranch.id,
            isActive: true,
          },
        })
      }

      for (const item of sale.saleItems) {
        const productExists = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, hasVariants: true },
        })

        if (!productExists) {
          continue
        }

        if (productExists.hasVariants) {
          await tx.stockMovement.create({
            data: {
              id: `stock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              businessId: tenant,
              productId: item.productId,
              type: "ENTRADA",
              quantity: item.quantity,
              reason: `Devolución por anulación de venta #${sale.ticketNumber} (revisar variante manualmente)`,
              userId: session!.user.id,
            },
          })
        } else if (mainWarehouse) {
          const productStock = await tx.productStock.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: mainWarehouse.id,
              },
            },
          })

          if (productStock) {
            await tx.productStock.update({
              where: {
                productId_warehouseId: {
                  productId: item.productId,
                  warehouseId: mainWarehouse.id,
                },
              },
              data: {
                stock: { increment: item.quantity },
                available: { increment: item.quantity },
              },
            })
          }

          await tx.stockMovement.create({
            data: {
              id: `stock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              businessId: tenant,
              productId: item.productId,
              type: "ENTRADA",
              quantity: item.quantity,
              reason: `Devolución por anulación de venta #${sale.ticketNumber}`,
              userId: session!.user.id,
            },
          })
        }
      }

      if (sale.clientId && sale.paymentMethod === "CUENTA_CORRIENTE") {
        await tx.client.update({
          where: { id: sale.clientId },
          data: {
            currentDebt: { decrement: sale.total },
          },
        })
      }

      if (sale.paymentMethod !== "CUENTA_CORRIENTE") {
        await tx.cashMovement.updateMany({
          where: {
            type: "VENTA",
            reference: id,
            businessId: tenant,
          },
          data: {
            description: `ANULADO - ${reason}`,
          },
        })

        await tx.cashMovement.create({
          data: {
            id: `cash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: "SALIDA",
            amount: sale.total,
            description: `Anulación de venta #${sale.ticketNumber} (${sale.paymentMethod}) - ${reason}`,
            reference: id,
            userId: session!.user.id,
            businessId: tenant,
          },
        })
      }

      return canceledSale
    })

    return NextResponse.json({
      message: "Venta anulada correctamente",
      sale: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 })
    }

    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
