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
    const limit = Math.max(1, Number(searchParams.get('limit') || 50))
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
    console.error('[API ERROR] GET /api/sales', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Función para sanitizar números y evitar NaN/undefined
const safeNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// Función para generar IDs únicos
const generateId = (prefix: string = ''): string => {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Función para validar datos de entrada antes del procesamiento
const validateSaleData = (data: any) => {
  console.log("🔍 [VALIDATION] Iniciando validación de datos de venta");

  // Validar que haya items
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("El carrito está vacío. Agregue al menos un producto.");
  }

  // Validar cada item
  for (const item of data.items) {
    if (!item.productId || typeof item.productId !== 'string') {
      throw new Error(`Producto inválido en el carrito: ${JSON.stringify(item)}`);
    }

    const quantity = safeNumber(item.quantity);
    if (quantity <= 0) {
      throw new Error(`Cantidad inválida para producto ${item.productId}: ${item.quantity}`);
    }

    const price = safeNumber(item.price || item.unitPrice);
    if (price <= 0) {
      throw new Error(`Precio inválido para producto ${item.productId}: ${item.price || item.unitPrice}`);
    }
  }

  console.log("✅ [VALIDATION] Datos básicos validados correctamente");
  return true;
};

// Función para calcular totales de manera segura
const calculateTotals = (items: any[], discount: number = 0, discountType: string = 'fixed') => {
  console.log("🧮 [CALCULATION] Calculando totales de venta");

  let subtotal = 0;

  for (const item of items) {
    const quantity = safeNumber(item.quantity) || 1;
    const price = safeNumber(item.price || item.unitPrice);
    const itemSubtotal = price * quantity;

    if (!Number.isFinite(itemSubtotal)) {
      throw new Error(`Cálculo inválido para item: ${JSON.stringify(item)}`);
    }

    subtotal += itemSubtotal;
  }

  const discountAmount = discountType === 'percentage'
    ? (subtotal * safeNumber(discount)) / 100
    : safeNumber(discount);

  const total = Math.max(0, subtotal - discountAmount);

  console.log(`✅ [CALCULATION] Subtotal: ${subtotal}, Descuento: ${discountAmount}, Total: ${total}`);

  return { subtotal, discountAmount, total };
};

// POST: Crear nueva venta
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let businessId: string;
  let session: any;

  try {
    console.log("🚀 [SALES API] Iniciando procesamiento de venta");

    // 1. Verificar permisos
    const permissionCheck = await requirePermission(request, 'pos:create_sale')
    if (!permissionCheck.authorized) {
      console.log("❌ [PERMISSION] Permiso denegado para crear venta");
      return permissionCheck.response
    }

    // 2. Rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "127.0.0.1"
    const { success, limit, reset, remaining } = await salesRateLimit(ip)

    if (!success) {
      console.log("❌ [RATE LIMIT] Límite de solicitudes excedido");
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
      console.log("❌ [AUTH] Tenant no autorizado");
      return tenantResult.response
    }
    businessId = tenantResult.tenant
    console.log(`✅ [AUTH] Usuario autenticado: ${session.user.id}, Business: ${businessId}`);

    // 4. Obtener y validar datos de entrada
    const body = await request.json()
    console.log("📦 [DATA] Datos recibidos:", JSON.stringify(body, null, 2));

    // Validación inicial antes de Zod
    validateSaleData(body);

    // 5. Normalizar items para el esquema
    if (Array.isArray(body.items)) {
      body.items = body.items.map((item: any) => {
        const price = safeNumber(item.price ?? item.unitPrice);
        const quantity = safeNumber(item.quantity) || 1;
        const subtotal = price * quantity;

        return {
          ...item,
          quantity,
          unitPrice: price,
          price,
          subtotal,
          discount: safeNumber(item.discount) || 0,
        };
      });
    }

    // 6. Validar con Zod
    const validationResult = saleSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("❌ [VALIDATION] Errores de validación:", validationResult.error.issues);
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

    console.log(`✅ [VALIDATION] Datos validados: ${items.length} items, método de pago: ${paymentMethod}`);

    // 7. Calcular totales de manera segura
    const { subtotal, discountAmount, total } = calculateTotals(items, discount, discountType);

    // 8. Generar número de ticket único
    const lastSale = await prisma.sale.findFirst({
      where: { userId: session.user.id },
      orderBy: { ticketNumber: "desc" },
      select: { ticketNumber: true }
    })
    const ticketNumber = (lastSale?.ticketNumber || 0) + 1
    console.log(`🎫 [TICKET] Número de ticket generado: ${ticketNumber}`);

    // 9. Buscar caja abierta del usuario
    const openCashRegister = await prisma.cashRegister.findFirst({
      where: {
        userId: session.user.id,
        businessId,
        status: 'OPEN'
      }
    })

    if (!openCashRegister) {
      console.log("⚠️ [CASH REGISTER] No hay caja abierta para el usuario");
    }

    // 10. EJECUTAR TRANSACCIÓN PRINCIPAL
    console.log("🔄 [TRANSACTION] Iniciando transacción de venta");
    const sale = await prisma.$transaction(async (tx) => {
      // 10.1 Crear la venta
      console.log("📝 [SALE] Creando registro de venta");
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
      console.log(`✅ [SALE] Venta creada con ID: ${newSale.id}`);

      // 10.2 Obtener o crear sucursal y almacén
      console.log("🏢 [BRANCH] Buscando sucursal principal");
      let mainBranch = await tx.branch.findFirst({
        where: { businessId, isMain: true, isActive: true }
      })

      if (!mainBranch) {
        mainBranch = await tx.branch.findFirst({
          where: { businessId, isActive: true }
        })
      }

      if (!mainBranch) {
        console.log("🏗️ [BRANCH] Creando sucursal principal");
        mainBranch = await tx.branch.create({
          data: {
            id: generateId('branch_'),
            businessId,
            name: 'Sucursal Principal',
            code: 'MAIN',
            isMain: true,
            isActive: true
          }
        })
      }

      console.log("🏭 [WAREHOUSE] Buscando almacén principal");
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
        console.log("🏗️ [WAREHOUSE] Creando almacén principal");
        mainWarehouse = await tx.warehouse.create({
          data: {
            id: generateId('warehouse_'),
            branchId: mainBranch.id,
            name: 'Almacén Principal',
            code: 'MAIN',
            isMain: true,
            isActive: true
          }
        })
      }

      // 10.3 Procesar items de venta y actualizar stock
      console.log(`📦 [ITEMS] Procesando ${items.length} items de venta`);
      for (const item of items) {
        console.log(`🔍 [PRODUCT] Verificando producto: ${item.productId}`);

        // Verificar que el producto existe y está activo
        const product = await tx.product.findFirst({
          where: { id: item.productId, businessId },
          select: { id: true, name: true, isActive: true }
        })

        if (!product || !product.isActive) {
          throw new Error(`Producto no disponible o inactivo: ${item.productId}`)
        }

        // Crear item de venta
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

        // Gestionar stock
        if (item.variantId) {
          console.log(`📊 [STOCK] Gestionando stock de variante: ${item.variantId}`);

          // Verificar variante
          const variant = await tx.productVariant.findFirst({
            where: { id: item.variantId, product: { businessId } },
            select: { id: true, isActive: true }
          })

          if (!variant || !variant.isActive) {
            throw new Error(`Variante no disponible: ${item.variantId}`)
          }

          // Gestionar stock de variante (permitir negativo)
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
          console.log(`📊 [STOCK] Gestionando stock de producto simple: ${item.productId}`);

          // Gestionar stock de producto simple (permitir negativo)
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

        // Registrar movimiento de stock
        await tx.stockMovement.create({
          data: {
            id: generateId('stock_'),
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

      // 10.4 Crear pagos mixtos si aplica
      if (hasMixedPayment && payments && payments.length > 0) {
        console.log(`💳 [PAYMENTS] Creando ${payments.length} pagos mixtos`);
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

      // 10.5 Registrar movimiento de caja (solo si no es cuenta corriente)
      if (paymentMethod !== "CUENTA_CORRIENTE") {
        console.log("💰 [CASH] Registrando movimiento de caja");
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

      // 10.6 Actualizar cliente si aplica
      if (clientId) {
        console.log(`👤 [CLIENT] Actualizando cliente: ${clientId}`);

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

        // Gestionar cuenta corriente
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
              id: generateId('log_'),
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

      console.log("✅ [TRANSACTION] Transacción completada exitosamente");
      return newSale
    })

    // 11. Generar factura ARCA si se solicita (fuera de la transacción principal)
    let arcaInvoice = null
    if ((body.generateArcaInvoice || body.generateAfipInvoice) && body.documentType !== "ticket") {
      try {
        console.log("📄 [INVOICE] Generando factura ARCA");

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
                saleId: sale.id,
                pointOfSaleId: pointOfSale.id,
                voucherType,
                documentType,
                documentNumber
              })
            })

            if (invoiceResponse.ok) {
              const invoiceData = await invoiceResponse.json()
              arcaInvoice = invoiceData.invoice
              console.log("✅ [INVOICE] Factura ARCA generada exitosamente");
            } else {
              console.error('❌ [INVOICE] Error al generar factura ARCA:', await invoiceResponse.text())
            }
          }
        }
      } catch (arcaError) {
        console.error('❌ [INVOICE] Error en generación de factura ARCA:', arcaError)
        // No fallar la venta si falla la factura
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`🎉 [SUCCESS] Venta completada exitosamente en ${processingTime}ms. ID: ${sale.id}`);

    return NextResponse.json({
      ...sale,
      arcaInvoice,
      afipInvoice: arcaInvoice,
      processingTime
    }, { status: 201 })

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [ERROR] Error en procesamiento de venta (${processingTime}ms):`, error)
    console.error("[ERROR] Stack:", error instanceof Error ? error.stack : "N/A")
    console.error("[ERROR] Type:", typeof error)

    // Manejo específico de errores de Prisma
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

    // Errores de negocio específicos
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('Producto no disponible')) {
      return NextResponse.json(
        { error: "Producto no disponible", details: errorMessage },
        { status: 400 }
      )
    }

    if (errorMessage.includes('Variante no disponible')) {
      return NextResponse.json(
        { error: "Variante de producto no disponible", details: errorMessage },
        { status: 400 }
      )
    }

    if (errorMessage.includes('carrito está vacío')) {
      return NextResponse.json(
        { error: "Carrito vacío", details: errorMessage },
        { status: 400 }
      )
    }

    // Error genérico
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: errorMessage,
        code: errorCode || "UNKNOWN",
        processingTime
      },
      { status: 500 }
    )
  }
}
