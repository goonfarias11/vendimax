import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createRefundSchema } from "@/lib/validations/refund"
import { requireTenant } from "@/lib/security/tenant"
import { ZodError } from "zod"

// POST /api/sales/[id]/refund - Crear devolución (total o parcial)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant
    const { id: saleId } = await params

    const body = await request.json()
    const validatedData = createRefundSchema.parse(body)

    const refund = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, businessId: tenant },
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
          refunds: true,
        },
      })

      if (!sale) {
        throw new Error("NOT_FOUND")
      }

      if (sale.status === "REEMBOLSADO") {
        throw new Error("ALREADY_REFUNDED")
      }

      let warehouseId = sale.warehouseId || null
      if (!warehouseId) {
        const mainWarehouse = await tx.warehouse.findFirst({
          where: {
            branch: { businessId: tenant },
            isMain: true,
            isActive: true,
          },
          select: { id: true },
        })
        if (!mainWarehouse) {
          throw new Error("NO_WAREHOUSE")
        }
        warehouseId = mainWarehouse.id
      }

      const totalRefunded = sale.refunds.reduce((sum, r) => sum + Number(r.refundAmount), 0)
      if (totalRefunded + validatedData.refundAmount > Number(sale.total)) {
        throw new Error("REFUND_EXCEEDS_TOTAL")
      }

      for (const item of validatedData.items) {
        const saleItem = sale.saleItems.find((si) => si.id === item.saleItemId)
        if (!saleItem) {
          throw new Error(`ITEM_NOT_FOUND:${item.saleItemId}`)
        }

        const alreadyRefunded = await tx.refundItem.aggregate({
          where: { saleItemId: item.saleItemId },
          _sum: { quantity: true },
        })
        const qtyRefunded = alreadyRefunded._sum.quantity || 0
        if (qtyRefunded + item.quantity > saleItem.quantity) {
          throw new Error(`REFUND_QTY_EXCEEDS:${saleItem.product.name}`)
        }
      }

      const newRefund = await tx.refund.create({
        data: {
          saleId,
          userId: session!.user.id,
          type: validatedData.type,
          reason: validatedData.reason,
          refundAmount: validatedData.refundAmount,
          restockItems: validatedData.restockItems,
          notes: validatedData.notes,
        },
      })

      for (const item of validatedData.items) {
        const saleItem = sale.saleItems.find((si) => si.id === item.saleItemId)!
        await tx.refundItem.create({
          data: {
            refundId: newRefund.id,
            saleItemId: item.saleItemId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          },
        })

        if (validatedData.restockItems) {
          const variantId = (saleItem as unknown as { variantId?: string }).variantId || (item as any).variantId

          if (variantId) {
            const updated = await tx.variantStock.updateMany({
              where: {
                variantId,
                warehouseId,
                businessId: tenant,
              },
              data: {
                stock: { increment: item.quantity },
                available: { increment: item.quantity },
              },
            })

            if (updated.count === 0) {
              throw new Error(`VARIANT_STOCK_NOT_FOUND:${variantId}`)
            }
          } else {
            await tx.productStock.upsert({
              where: {
                productId_warehouseId: {
                  productId: item.productId,
                  warehouseId,
                },
              },
              create: {
                productId: item.productId,
                warehouseId,
                stock: item.quantity,
                available: item.quantity,
              },
              update: {
                stock: { increment: item.quantity },
                available: { increment: item.quantity },
              },
            })
          }

          await tx.stockMovement.create({
            data: {
              businessId: tenant,
              productId: item.productId,
              variantId,
              type: "ENTRADA",
              quantity: item.quantity,
              reason: `Devolución ${validatedData.type === "TOTAL" ? "total" : "parcial"} - Venta #${
                sale.ticketNumber || sale.id.slice(-6)
              }`,
              reference: newRefund.id,
              userId: session!.user.id,
              warehouseId,
            },
          })
        }
      }

      const newTotalRefunded = totalRefunded + validatedData.refundAmount
      const isFullyRefunded = newTotalRefunded >= Number(sale.total)

      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: isFullyRefunded ? "REEMBOLSADO" : "PARCIALMENTE_REEMBOLSADO",
        },
      })

      if (sale.paymentMethod !== "CUENTA_CORRIENTE") {
        await tx.cashMovement.create({
          data: {
            type: "SALIDA",
            amount: validatedData.refundAmount,
            description: `Devolución ${validatedData.type === "TOTAL" ? "total" : "parcial"} - Venta #${
              sale.ticketNumber || sale.id.slice(-6)
            } - ${validatedData.reason}`,
            reference: newRefund.id,
            userId: session!.user.id,
            businessId: tenant,
            cashRegisterId: sale.cashRegisterId || null,
          },
        })
      }

      if (sale.clientId && sale.paymentMethod === "CUENTA_CORRIENTE") {
        await tx.client.update({
          where: { id: sale.clientId },
          data: {
            currentDebt: { decrement: validatedData.refundAmount },
          },
        })
      }

      return newRefund
    })

    const refundWithDetails = await prisma.refund.findUnique({
      where: { id: refund.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        sale: {
          select: {
            ticketNumber: true,
            total: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(refundWithDetails, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }

    const message = (error as Error).message
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }
    if (message === "ALREADY_REFUNDED") {
      return NextResponse.json({ error: "Esta venta ya fue completamente reembolsada" }, { status: 400 })
    }
    if (message === "NO_WAREHOUSE") {
      return NextResponse.json({ error: "No hay un almacén disponible para devolver stock" }, { status: 400 })
    }
    if (message === "REFUND_EXCEEDS_TOTAL") {
      return NextResponse.json(
        { error: "El monto total de devoluciones excede el total de la venta" },
        { status: 400 },
      )
    }
    if (message.startsWith("ITEM_NOT_FOUND")) {
      return NextResponse.json({ error: "Item de venta no encontrado" }, { status: 400 })
    }
    if (message.startsWith("REFUND_QTY_EXCEEDS")) {
      return NextResponse.json({ error: "La cantidad a devolver excede la cantidad vendida" }, { status: 400 })
    }
    if (message.startsWith("VARIANT_NOT_FOUND")) {
      return NextResponse.json({ error: "Variante no encontrada para el producto" }, { status: 400 })
    }

    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/sales/[id]/refund - Obtener devoluciones de una venta
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant
    const { id: saleId } = await params

    const refunds = await prisma.refund.findMany({
      where: { saleId, sale: { businessId: tenant } },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(refunds)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
