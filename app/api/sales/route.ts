import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createSaleSchema } from "@/lib/validations/sale"
import { salesRateLimit } from "@/lib/rateLimit"
import { logger } from "@/lib/logger"
import { z } from "zod"
import { verifyProductOwnership } from "@/lib/security/multi-tenant"
import { requirePermission } from "@/lib/auth-middleware"

export const runtime = 'nodejs'

// Función para sanitizar números y evitar NaN/undefined en respuestas
const safeNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// GET: Listar ventas con filtros avanzados
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'pos:access')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const clientId = searchParams.get('clientId')
    const paymentMethod = searchParams.get('paymentMethod')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      businessId: session.user.businessId
    }

    // Si es VENDEDOR, solo ver sus ventas
    if (session.user.role === 'VENDEDOR') {
      where.userId = session.user.id
    } else if (userId && userId !== 'all') {
      where.userId = userId
    }

    if (clientId && clientId !== 'all') {
      where.clientId = clientId
    }

    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    if (search) {
      where.ticketNumber = { contains: search }
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          saleItems: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              price: true,
              subtotal: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.sale.count({ where })
    ])

    // Sanitizar y formatear respuesta (tolerante a datos corruptos)
    const formattedSales = sales.map(sale => {
      try {
        const sanitizedTotal = safeNumber(sale.total);
        const sanitizedSubtotal = safeNumber(sale.subtotal);
        
        // Debug: Log si hay valores corruptos
        if (sanitizedTotal === 0 && sale.saleItems.length > 0) {
          console.warn(`⚠️ Venta ${sale.id} tiene total 0 pero ${sale.saleItems.length} items`);
          console.log('Datos originales:', { 
            total: sale.total, 
            subtotal: sale.subtotal,
            type: typeof sale.total 
          });
        }
        
        return {
          id: sale.id,
          ticketNumber: sale.ticketNumber,
          createdAt: sale.createdAt,
          client: sale.client,
          user: sale.user,
          subtotal: sanitizedSubtotal,
          discount: safeNumber(sale.discount),
          total: sanitizedTotal,
          paymentMethod: sale.paymentMethod,
          status: sale.status,
          itemsCount: sale.saleItems.length,
          saleItems: sale.saleItems.map(item => ({
            id: item.id,
            productId: item.productId,
            quantity: safeNumber(item.quantity),
            price: safeNumber(item.price),
            subtotal: safeNumber(item.subtotal),
            product: item.product
          }))
        };
      } catch (error) {
        console.error(`⚠️ Error sanitizando venta ${sale.id}:`, error);
        // Devolver venta con valores seguros si falla
        return {
          id: sale.id,
          ticketNumber: sale.ticketNumber,
          createdAt: sale.createdAt,
          client: sale.client,
          user: sale.user,
          subtotal: 0,
          discount: 0,
          total: 0,
          paymentMethod: sale.paymentMethod,
          status: sale.status,
          itemsCount: 0,
          saleItems: []
        };
      }
    });

    return NextResponse.json({
      sales: formattedSales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json({ error: "Error al cargar ventas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar permiso para crear ventas
    const permissionCheck = await requirePermission(request, 'pos:create_sale')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

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
    if (!session?.user?.id || !session?.user?.businessId) {
      return NextResponse.json(
        { error: "No autorizado" }, 
        { status: 401 }
      )
    }

    const businessId = session.user.businessId
    const body = await request.json()
    
    // Log temporal para debug
    console.log("=== DATOS RECIBIDOS ===")
    console.log("Body completo:", JSON.stringify(body, null, 2))
    console.log("Tipos de datos:")
    console.log("- subtotal:", typeof body.subtotal, body.subtotal)
    console.log("- total:", typeof body.total, body.total)
    console.log("- discount:", typeof body.discount, body.discount)
    if (body.items && body.items.length > 0) {
      console.log("- items[0].quantity:", typeof body.items[0].quantity, body.items[0].quantity)
      console.log("- items[0].unitPrice:", typeof body.items[0].unitPrice, body.items[0].unitPrice)
      console.log("- items[0].subtotal:", typeof body.items[0].subtotal, body.items[0].subtotal)
    }
    
    // Validar datos de entrada
    const validationResult = createSaleSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("=== VALIDACIÓN FALLIDA ===")
      console.error("Errores completos:", JSON.stringify(validationResult.error.issues, null, 2))
      return NextResponse.json(
        { 
          error: "Datos inválidos",
          details: validationResult.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        },
        { status: 400 }
      )
    }
    
    console.log("=== VALIDACIÓN EXITOSA ===")
    console.log("Datos validados:", JSON.stringify(validationResult.data, null, 2))
    
    const { 
      clientId, 
      paymentMethod, 
      items,
      discount = 0,
      discountType = "fixed",
      hasMixedPayment = false,
      payments = []
    } = validationResult.data

    // Función segura para validar y convertir números (anti-NaN)
    const safeNumber = (value: any): number => {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    };

    // Recalcular y validar totales en el backend (nunca confiar en el frontend)
    const calculatedSubtotal = items.reduce((sum: number, item: any) => {
      const qty = safeNumber(item.quantity) || 1;
      const price = safeNumber(item.unitPrice);
      const itemSubtotal = price * qty;
      
      // Validar que no haya NaN
      if (!Number.isFinite(itemSubtotal)) {
        console.error(`⚠️ Item con valores inválidos:`, item);
        return sum;
      }
      
      return sum + itemSubtotal;
    }, 0);
    
    const calculatedDiscountAmount = discountType === "percentage" 
      ? safeNumber((calculatedSubtotal * safeNumber(discount)) / 100)
      : safeNumber(discount);
    
    const calculatedTotal = Math.max(0, safeNumber(calculatedSubtotal - calculatedDiscountAmount));
    
    console.log("=== CÁLCULOS DEL BACKEND (ANTI-NaN) ===");
    console.log("Subtotal calculado:", calculatedSubtotal, "isFinite:", Number.isFinite(calculatedSubtotal));
    console.log("Descuento calculado:", calculatedDiscountAmount, "isFinite:", Number.isFinite(calculatedDiscountAmount));
    console.log("Total calculado:", calculatedTotal, "isFinite:", Number.isFinite(calculatedTotal));
    
    // Validación final: si algún valor es NaN, rechazar
    if (!Number.isFinite(calculatedSubtotal) || !Number.isFinite(calculatedTotal)) {
      console.error("❌ ERROR: Cálculos resultaron en NaN");
      return NextResponse.json(
        { error: "Error en los cálculos. Los valores numéricos no son válidos." },
        { status: 400 }
      );
    }

    // Verificar stock antes de crear la venta
    for (const item of items) {
      // Verificar que el producto pertenezca al negocio
      await verifyProductOwnership(item.productId, businessId)
      
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true, isActive: true, businessId: true, hasVariants: true }
      })

      if (!product || product.businessId !== businessId) {
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

      // Validar stock para productos con variantes
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true, name: true, isActive: true }
        })

        if (!variant) {
          return NextResponse.json(
            { error: `Variante no encontrada para ${product.name}` },
            { status: 400 }
          )
        }

        if (!variant.isActive) {
          return NextResponse.json(
            { error: `La variante ${variant.name} de ${product.name} está inactiva` },
            { status: 400 }
          )
        }

        if (variant.stock < item.quantity) {
          return NextResponse.json(
            { error: `Stock insuficiente para ${product.name} - ${variant.name}. Disponible: ${variant.stock}` },
            { status: 400 }
          )
        }
      } else {
        // Validar stock para productos sin variantes
        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` },
            { status: 400 }
          )
        }
      }
    }

    // Usar los valores calculados en el backend para mayor confiabilidad
    const subtotal = calculatedSubtotal
    const discountAmount = calculatedDiscountAmount
    const total = calculatedTotal

    // Generar número de ticket
    const lastSale = await prisma.sale.findFirst({
      where: { userId: session.user.id },
      orderBy: { ticketNumber: "desc" },
      select: { ticketNumber: true }
    })
    const ticketNumber = (lastSale?.ticketNumber || 0) + 1

    // Buscar caja abierta del usuario
    const openCashRegister = await prisma.cashRegister.findFirst({
      where: {
        userId: session.user.id,
        businessId,
        status: 'OPEN'
      }
    })

    // Crear venta con items en una transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const newSale = await tx.sale.create({
        data: {
          clientId,
          userId: session.user.id,
          businessId,
          cashRegisterId: openCashRegister?.id, // Asociar a caja abierta
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
      if (hasMixedPayment && payments && payments.length > 0) {
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

      // Registrar movimiento de caja (solo si no es cuenta corriente)
      if (paymentMethod !== "CUENTA_CORRIENTE") {
        await tx.cashMovement.create({
          data: {
            userId: session.user.id,
            businessId,
            cashRegisterId: openCashRegister?.id,
            type: "VENTA",
            amount: total,
            description: `Venta #${ticketNumber} - ${paymentMethod}`,
            reference: newSale.id
          }
        })
      }

      // Actualizar cliente: última compra y deuda si es cuenta corriente
      if (clientId) {
        const updateData: any = {
          lastPurchaseAt: new Date()
        }

        if (paymentMethod === "CUENTA_CORRIENTE") {
          updateData.currentDebt = { increment: total }
        }

        const updatedClient = await tx.client.update({
          where: { id: clientId },
          data: updateData
        })

        // Si usa cuenta corriente, verificar si excede el límite y actualizar estado
        if (paymentMethod === "CUENTA_CORRIENTE") {
          const newDebt = Number(updatedClient.currentDebt) + total
          
          if (newDebt > Number(updatedClient.creditLimit) && updatedClient.status === 'ACTIVE') {
            await tx.client.update({
              where: { id: clientId },
              data: { status: 'DELINQUENT' }
            })
          }

          // Registrar en log de actividad
          await tx.clientActivityLog.create({
            data: {
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              clientId,
              action: 'SALE',
              description: `Venta a crédito #${ticketNumber} por $${total}`,
              userId: session.user.id,
              metadata: {
                saleId: newSale.id,
                amount: total,
                previousDebt: updatedClient.currentDebt.toString(),
                newDebt: newDebt.toString()
              },
              ipAddress: ip,
              createdAt: new Date()
            }
          })
        }
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