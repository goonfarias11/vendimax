import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { requirePermission } from "@/lib/auth-middleware"
import { z } from "zod"

export const runtime = 'nodejs'

const cancelSaleSchema = z.object({
  reason: z.string().min(10, "El motivo debe tener al menos 10 caracteres")
})

// GET: Obtener detalle de venta
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const permissionCheck = await requirePermission(request, 'pos:access')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const where: any = {
      id,
      businessId: session.user.businessId
    }

    // Si es VENDEDOR, solo puede ver sus propias ventas
    if (session.user.role === 'VENDEDOR') {
      where.userId = session.user.id
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
                cost: true
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        // cashMovement: true // TODO: Agregar relación en schema si es necesaria
      }
    })

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    // Si es VENDEDOR, no mostrar costos ni márgenes
    if (session.user.role === 'VENDEDOR') {
      // No modificar sale.saleItems directamente para evitar conflicto de tipos
      const sanitizedSale = {
        ...sale,
        saleItems: sale.saleItems.map(item => ({
          ...item,
          product: {
            ...item.product,
            cost: new Prisma.Decimal(0) // Ocultar costo
          }
        }))
      }
      return NextResponse.json(sanitizedSale)
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error("Error fetching sale:", error)
    return NextResponse.json({ error: "Error al cargar venta" }, { status: 500 })
  }
}

// PUT: Anular venta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const permissionCheck = await requirePermission(request, 'pos:cancel_sale')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.businessId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = cancelSaleSchema.parse(body)

    // Verificar que la venta existe
    const sale = await prisma.sale.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      },
      include: {
        saleItems: {
          include: {
            product: true
          }
        },
        client: true
      }
    })

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 })
    }

    if (sale.status === 'CANCELADO') {
      return NextResponse.json({ error: "La venta ya está cancelada" }, { status: 400 })
    }

    // Anular en transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Marcar venta como anulada
      const canceledSale = await tx.sale.update({
        where: { id },
        data: {
          status: 'CANCELADO',
          updatedAt: new Date()
        }
      })

      // 2. Revertir stock
      for (const item of sale.saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity }
          }
        })

        // Registrar movimiento de stock
        await tx.stockMovement.create({
          data: {
            id: `stock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            productId: item.productId,
            type: 'ENTRADA',
            quantity: item.quantity,
            reason: `Devolución por anulación de venta #${sale.ticketNumber}`,
            userId: session.user.id,
            // businessId: session.user.businessId // TODO: Agregar campo a schema si es necesario
          }
        })
      }

      // 3. Si había cliente con crédito, revertir deuda
      if (sale.clientId && sale.paymentMethod === 'CUENTA_CORRIENTE') {
        await tx.client.update({
          where: { id: sale.clientId },
          data: {
            currentDebt: { decrement: sale.total }
          }
        })
      }

      // 4. Anular movimiento de caja
      if (sale.paymentMethod !== 'CUENTA_CORRIENTE') {
        await tx.cashMovement.updateMany({
          where: {
            type: 'VENTA',
            reference: id // Campo reference, no referenceId
          },
          data: {
            description: `ANULADO - ${reason}`
          }
        })

        // Crear movimiento de corrección
        await tx.cashMovement.create({
          data: {
            id: `cash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'SALIDA',
            amount: sale.total,
            description: `Anulación de venta #${sale.ticketNumber} (${sale.paymentMethod}) - ${reason}`,
            reference: id, // Campo reference, no referenceId
            userId: session.user.id,
            businessId: session.user.businessId!
          }
        })
      }

      // 5. Log de auditoría
      // TODO: Implementar modelo AuditLog en schema
      // // TODO: Implementar modelo AuditLog en schema
      // await tx.auditLog.create({
      //   data: {
      //     id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      //     userId: session.user.id,
      //     businessId: session.user.businessId,
      //     action: 'SALE_CANCELED',
      //     entity: 'Sale',
      //     entityId: id,
      //     details: `Venta #${sale.ticketNumber} anulada - ${reason}`,
      //     metadata: {
      //       saleId: id,
      //       ticketNumber: sale.ticketNumber,
      //       total: sale.total.toString(),
      //       reason,
      //       items: sale.saleItems.length
      //     }
      //   }
      // })

      return canceledSale
    })

    return NextResponse.json({
      message: "Venta anulada correctamente",
      sale: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error canceling sale:", error)
    return NextResponse.json({ error: "Error al anular venta" }, { status: 500 })
  }
}
