import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { salesRateLimit } from "@/lib/rateLimit"
import { logger } from "@/lib/logger"
import { z } from "zod"
import { requirePermission } from "@/lib/auth-middleware"
import { PaymentMethod, Prisma, SaleStatus } from "@prisma/client"
import { requireTenant } from "@/lib/security/tenant"
import { saleSchema } from "@/lib/validation/sale.schema"

export const runtime = 'nodejs'

const MAX_PAGE_SIZE = 100

// GET: Listar ventas para historial
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'pos:access')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const businessId = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const paymentMethod = searchParams.get('paymentMethod')
    const status = searchParams.get('status')
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    // Fix: cap máximo de paginación para evitar DoS
    const limit = Math.min(Math.max(1, Number(searchParams.get('limit') || 50)), MAX_PAGE_SIZE)
    const skip = (page - 1) * limit

    const where: Prisma.SaleWhereInput = {
      businessId,
    }

    const createdAtFilter: Prisma.DateTimeFilter = {}
    if (startDate) {
      createdAtFilter.gte = new Date(startDate)
    }
    if (endDate) {
      createdAtFilter.lte = new Date(endDate)
    }
    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter
    }

    if (userId && userId !== 'all') {
      where.userId = userId
    }

    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod as PaymentMethod
    }

    if (status && status !== 'all') {
      where.status = status as SaleStatus
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        select: {
          id: true,
          ticketNumber: true,
          createdAt: true,
          total: true,
          subtotal: true,
          discount: true,
          paymentMethod: true,
          status: true,
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              saleItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ])

    const formattedSales = sales.map((sale) => ({
      ...sale,
      itemsCount: sale._count?.saleItems ?? 0,
    }))

    return NextResponse.json({
      sales: formattedSales,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('[API ERROR] GET /api/sales', { error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Función para sanitizar números y evitar NaN/undefined
const safeNumber = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

// Función para validar datos de entrada antes del procesamiento
const validateSaleData = (data: any) => {
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("El carrito está vacío. Agregue al menos un producto.")
  }

  for (const item of data.items) {
    if (!item.productId || typeof item.productId !== 'string') {
      throw new Error(`Producto inválido en el carrito`)
    }

    const quantity = safeNumber(item.quantity)
    if (quantity <= 0) {
      throw new Error(`Cantidad inválida para producto ${item.productId}`)
    }

    const price = safeNumber(item.price || item.unitPrice)
    if (price <= 0) {
      throw new Error(`Precio inválido para producto ${item.productId}`)
    }
  }

  return true
}

// Función para calcular totales de manera segura
const calculateTotals = (items: any[], discount: number = 0, discountType: string = 'fixed') => {
  let subtotal = 0

  for (const item of items) {
    const quantity = safeNumber(item.quantity) || 1
    const price = safeNumber(item.price || item.unitPrice)
    const itemSubtotal = price * quantity

    if (!Number.isFinite(itemSubtotal)) {
      throw new Error(`Cálculo inválido para un item del carrito`)
    }

    subtotal += itemSubtotal
  }

  const discountAmount = discountType === 'percentage'
    ? (subtotal * safeNumber(discount)) / 100
    : safeNumber(discount)

  const total = Math.max(0, subtotal - discountAmount)

  return { subtotal, discountAmount, total }
}

// POST: Crear nueva venta
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let businessId: string
  let session: any

  try {
    // 1. Verificar permisos
    const permissionCheck = await requirePermission(request, 'pos:create_sale')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    // 2. Rate limiting
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

    // 3. Autenticación y tenant
    session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    businessId = tenantResult.tenant

    // 4. Obtener y validar datos de entrada
    const body = await request.json()

    validateSaleData(body)

    // 5. Normalizar items para el esquema
    if (Array.isArray(body.items)) {
      body.items = body.items.map((item: any) => {
        const price = safeNumber(item.price ?? item.unitPrice)
        const quantity = safeNumber(item.quantity) || 1
        const subtotal = price * quantity

        return {
          ...item,
          quantity,
          unitPrice: price,
          price,
          subtotal,
          discount: safeNumber(item.discount) || 0,
        }
      })
    }

    // 6. Validar con Zod
    const validationResult = saleSchema.safeParse(body)
    if (!validationResult.success) {
      logger.warn('[SALES] Errores de validación Zod', { issues: validationResult.error.issues })
      return NextResponse.json(
        {
          error: "Datos de venta inválidos",
          details: validationResult.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        },
        { status: 400 }
      )
    }

    const {
      clientId,
      paymentMethod,
      items,
      discount = 0,
      discountType = "fixed",
      hasMixedPayment = false,
      payments = []
    } = validationResult.data

    // 7. Calcular totales de manera segura
    const { subtotal, discountAmount, total } = calculateTotals(items, discount, discountType)

    // 8. Buscar caja abierta del usuario
    const openCashRegister = await prisma.cashRegister.findFirst({
      where: {
        userId: session.user.id,
        businessId,
        status: 'OPEN'
      }
    })

    // 9. EJECUTAR TRANSACCIÓN PRINCIPAL
    const sale = await prisma.$transaction(async (tx) => {
      // 9.1 Generar ticketNumber dentro de la transacción (evita race condition)
      const lastSale = await tx.sale.findFirst({
        where: { userId: session.user.id },
        orderBy: { ticketNumber: "desc" },
        select: { ticketNumber: true }
      })
      const ticketNumber = (lastSale?.ticketNumber || 0) + 1

      // 9.2 Crear la venta
      const newSale = await tx.sale.create({
        data: {
          clientId,
          userId: session.user.id,
          businessId,
          cashRegisterId: openCashRegister?.id,
          total,
          subtotal,
          tax: 0,
          discount: discountAmount,
          discountType,
          paymentMethod: paymentMethod as PaymentMethod,
          hasMixedPayment,
          ticketNumber,
          status: "COMPLETADO"
        }
      })

      // 9.3 Obtener o crear sucursal y almacén
      let mainBranch = await tx.branch.findFirst({
        where: { businessId, isMain: true, isActive: true }
      })

      if (!mainBranch) {
        mainBranch = await tx.branch.findFirst({
          where: { businessId, isActive: true }
        })
      }

      if (!mainBranch) {
        mainBranch = await tx.branch.create({
          data: {
            businessId,
            name: 'Sucursal Principal',
            code: 'MAIN',
            isMain: true,
            isActive: true
          }
        })
      }

      let mainWarehouse = await tx.warehouse.findFirst({
        where: {
          branchId: mainBranch.id,
          isMain: true,
          isActive: true
        }
      })

      if (!mainWarehouse) {
        mainWarehouse = await tx.warehouse.findFirst({
          where: {
            branchId: mainBranch.id,
            isActive: true
          }
        })
      }

      if (!mainWarehouse) {
        mainWarehouse = await tx.warehouse.create({
          data: {
            branchId: mainBranch.id,
            name: 'Almacén Principal',
            code: 'MAIN',
            isMain: true,
            isActive: true
          }
        })
      }

      // 9.4 Procesar items de venta y actualizar stock
      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, businessId },
          select: { id: true, name: true, isActive: true }
        })

        if (!product || !product.isActive) {
          throw new Error(`Producto no disponible o inactivo: ${item.productId}`)
        }

        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            variantId: item.variantId || null,
            businessId,
            quantity: item.quantity as number,
            price: item.unitPrice as number,
            subtotal: item.subtotal as number
          }
        })

        if (item.variantId) {
          const variant = await tx.productVariant.findFirst({
            where: { id: item.variantId, product: { businessId } },
            select: { id: true, isActive: true }
          })

          if (!variant || !variant.isActive) {
            throw new Error(`Variante no disponible: ${item.variantId}`)
          }

          await tx.variantStock.upsert({
            where: {
              variantId_warehouseId: {
                variantId: item.variantId,
                warehouseId: mainWarehouse.id
              }
            },
            create: {
              variantId: item.variantId,
              warehouseId: mainWarehouse.id,
              businessId,
              stock: -item.quantity,
              available: -item.quantity
            },
            update: {
              stock: { decrement: item.quantity },
              available: { decrement: item.quantity }
            }
          })
        } else {
          await tx.productStock.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: mainWarehouse.id
              }
            },
            create: {
              productId: item.productId,
              warehouseId: mainWarehouse.id,
              stock: -item.quantity,
              available: -item.quantity,
              reserved: 0
            },
            update: {
              stock: { decrement: item.quantity },
              available: { decrement: item.quantity }
            }
          })
        }

        await tx.stockMovement.create({
          data: {
            businessId,
            productId: item.productId,
            variantId: item.variantId || null,
            type: 'SALIDA',
            quantity: item.quantity,
            reason: `Venta #${ticketNumber}`,
            reference: newSale.id,
            userId: session.user.id,
            warehouseId: mainWarehouse.id
          }
        })
      }

      // 9.5 Crear pagos mixtos si aplica
      if (hasMixedPayment && payments && payments.length > 0) {
        for (const payment of payments) {
          await tx.salePayment.create({
            data: {
              saleId: newSale.id,
              paymentMethod: payment.method as PaymentMethod,
              amount: payment.amount,
              reference: payment.reference || null
            }
          })
        }
      }

      // 9.6 Registrar movimiento de caja (solo si no es cuenta corriente)
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

      // 9.7 Actualizar cliente si aplica
      if (clientId) {
        const updateData: Prisma.ClientUpdateInput = {
          lastPurchaseAt: new Date()
        }

        if (paymentMethod === "CUENTA_CORRIENTE") {
          updateData.currentDebt = { increment: total }
        }

        const updatedClient = await tx.client.update({
          where: { id: clientId },
          data: updateData
        })

        if (paymentMethod === "CUENTA_CORRIENTE") {
          const newDebt = Number(updatedClient.currentDebt) + total

          if (newDebt > Number(updatedClient.creditLimit) && updatedClient.status === 'ACTIVE') {
            await tx.client.update({
              where: { id: clientId },
              data: { status: 'DELINQUENT' }
            })
          }

          await tx.clientActivityLog.create({
            data: {
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

      return { sale: newSale, ticketNumber }
    })

    // 10. Generar factura ARCA si se solicita (fuera de la transacción principal)
    let arcaInvoice = null
    if ((body.generateArcaInvoice || body.generateAfipInvoice) && body.documentType !== "ticket") {
      try {
        const arcaConfig = await prisma.afipConfig.findUnique({
          where: { businessId }
        })

        if (arcaConfig && arcaConfig.isActive) {
          const pointOfSale = await prisma.pointOfSale.findFirst({
            where: {
              afipConfigId: arcaConfig.id,
              isActive: true
            }
          })

          if (pointOfSale) {
            const voucherTypeMap: { [key: string]: number } = {
              'factura_a': 1,
              'factura_b': 6,
              'factura_c': 11
            }

            const docTypeMap: { [key: string]: number } = {
              'CUIT': 80,
              'CUIL': 86,
              'DNI': 96
            }

            const voucherType = voucherTypeMap[body.documentType] || 6
            const documentType = body.clientDocType ? docTypeMap[body.clientDocType] : 99
            const documentNumber = body.clientDocNumber || '0'

            const invoiceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/arca/invoices`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
              },
              body: JSON.stringify({
                saleId: sale.sale.id,
                pointOfSaleId: pointOfSale.id,
                voucherType,
                documentType,
                documentNumber
              })
            })

            if (invoiceResponse.ok) {
              const invoiceData = await invoiceResponse.json()
              arcaInvoice = invoiceData.invoice
            } else {
              logger.error('[SALES] Error al generar factura ARCA', { status: invoiceResponse.status })
            }
          }
        }
      } catch (arcaError) {
        logger.error('[SALES] Error en generación de factura ARCA', { error: arcaError })
        // No fallar la venta si falla la factura
      }
    }

    const processingTime = Date.now() - startTime
    logger.info('[SALES] Venta completada', { saleId: sale.sale.id, processingTime })

    return NextResponse.json({
      ...sale.sale,
      arcaInvoice,
      afipInvoice: arcaInvoice,
      processingTime
    }, { status: 201 })

  } catch (error) {
    const processingTime = Date.now() - startTime
    logger.error('[SALES] Error en procesamiento de venta', { error, processingTime })

    const errorCode = typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: string }).code
      : undefined

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Datos de venta inválidos",
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    if (errorCode === 'P2002') {
      return NextResponse.json(
        { error: "Ya existe un registro con esos datos únicos" },
        { status: 409 }
      )
    }

    if (errorCode === 'P2025') {
      return NextResponse.json(
        { error: "Uno o más registros relacionados no fueron encontrados" },
        { status: 404 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('Producto no disponible')) {
      return NextResponse.json(
        { error: "Producto no disponible" },
        { status: 400 }
      )
    }

    if (errorMessage.includes('Variante no disponible')) {
      return NextResponse.json(
        { error: "Variante de producto no disponible" },
        { status: 400 }
      )
    }

    if (errorMessage.includes('carrito está vacío')) {
      return NextResponse.json(
        { error: "Carrito vacío" },
        { status: 400 }
      )
    }

    // Error genérico — no exponer detalles internos en producción
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        ...(process.env.NODE_ENV !== 'production' && { details: errorMessage, code: errorCode }),
        processingTime
      },
      { status: 500 }
    )
  }
}
