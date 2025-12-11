import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createSaleSchema } from "@/lib/validations"
import { salesRateLimit } from "@/lib/rateLimit"
import { logger } from "@/lib/logger"
import { z } from "zod"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1"
    const { success, limit, reset, remaining } = await salesRateLimit(ip)
    
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toISOString(),
          }
        }
      )
    }

    // Autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Log temporal para debug
    logger.debug("Body recibido en sales API:", { body })
    
    const { 
      clientId, 
      paymentMethod, 
      items,
      discount = 0,
      discountType = "fixed",
      hasMixedPayment = false,
      payments = []
    } = body

    // Verificar stock antes de crear la venta
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true, isActive: true }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Producto ${item.productId} no encontrado` },
          { status: 400 }
        )
      }

      if (!product.isActive) {
        return NextResponse.json(
          { error: `El producto ${product.name} está inactivo` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` },
          { status: 400 }
        )
      }
    }

    // Calcular total
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.unitPrice * item.quantity)
    }, 0)
    
    // Aplicar descuento
    const discountAmount = discountType === "percentage" 
      ? (subtotal * discount) / 100 
      : discount
    
    const total = Math.max(0, subtotal - discountAmount)

    // Generar número de ticket
    const lastSale = await prisma.sale.findFirst({
      where: { userId: session.user.id },
      orderBy: { ticketNumber: "desc" },
      select: { ticketNumber: true }
    })
    const ticketNumber = (lastSale?.ticketNumber || 0) + 1

    // Crear venta con items en una transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const newSale = await tx.sale.create({
        data: {
          clientId,
          userId: session.user.id,
          total,
          subtotal,
          tax: 0,
          discount: discountAmount,
          discountType,
          paymentMethod,
          hasMixedPayment,
          ticketNumber,
          status: "COMPLETADO"
        }
      })

      // Crear los items de venta y actualizar stock
      for (const item of items) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
            subtotal: item.subtotal
          }
        })

        // Reducir stock del producto o variante
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } }
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          })
        }
      }

      // Crear pagos mixtos si aplica
      if (hasMixedPayment && payments.length > 0) {
        for (const payment of payments) {
          await tx.salePayment.create({
            data: {
              saleId: newSale.id,
              paymentMethod: payment.method,
              amount: payment.amount,
              reference: payment.reference || null
            }
          })
        }
      }

      // Registrar movimiento de caja
      await tx.cashMovement.create({
        data: {
          userId: session.user.id,
          type: "INGRESO",
          amount: total,
          description: `Venta #${ticketNumber} - ${paymentMethod}`,
          reference: newSale.id
        }
      })

      // Si el cliente tiene cuenta corriente, actualizar deuda
      if (clientId && paymentMethod === "CUENTA_CORRIENTE") {
        await tx.client.update({
          where: { id: clientId },
          data: {
            currentDebt: { increment: total }
          }
        })
      }

      return newSale
    })

    return NextResponse.json(sale, { status: 201 })
    
  } catch (error: any) {
    logger.error("Error creating sale:", error)
    
    // Manejo de errores de Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Datos inválidos",
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    // Errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Ya existe un registro con esos datos" },
        { status: 409 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Error al crear la venta" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const sales = await prisma.sale.findMany({
      include: {
        client: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            name: true
          }
        },
        saleItems: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })

    // Formatear ventas con números convertidos
    const formattedSales = sales.map(sale => ({
      ...sale,
      total: Number(sale.total),
      subtotal: Number(sale.subtotal),
      tax: Number(sale.tax),
      discount: Number(sale.discount),
      saleItems: sale.saleItems.map(item => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal)
      }))
    }))

    return NextResponse.json(formattedSales)
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json({ error: "Error al cargar ventas" }, { status: 500 })
  }
}
