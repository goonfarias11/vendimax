import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-middleware"
import { requireTenant } from "@/lib/security/tenant"
import { stockMovementSchema } from "@/lib/validation/stockMovement.schema"

// POST /api/products/stock-movements - Registrar movimiento de stock
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant

    requireRole(session!.user, ["OWNER", "ADMIN", "MANAGER"])

    const parsed = stockMovementSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 },
      )
    }
    const { productId, variantId, type, quantity, reason, reference } = parsed.data

    const validTypes = ["ENTRADA", "SALIDA", "AJUSTE", "TRANSFERENCIA"]
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Tipo de movimiento inválido" }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId: tenant,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const movement = await prisma.$transaction(async (tx) => {
      // Resolver almacén principal
      let mainWarehouse = await tx.warehouse.findFirst({
        where: {
          branch: { businessId: tenant },
          isMain: true,
          isActive: true,
        },
      })

      if (!mainWarehouse) {
        mainWarehouse = await tx.warehouse.findFirst({
          where: {
            branch: { businessId: tenant },
            isActive: true,
          },
        })
      }

      if (!mainWarehouse) {
        throw new Error("No hay un almacén activo configurado")
      }

      if (variantId) {
        const variant = await tx.productVariant.findFirst({
          where: {
            id: variantId,
            productId,
            product: { businessId: tenant },
          },
        })

        if (!variant) {
          throw new Error("Variante no encontrada")
        }

        await tx.variantStock.upsert({
          where: {
            variantId_warehouseId: {
              variantId,
              warehouseId: mainWarehouse.id,
            },
          },
          update: {},
          create: {
            variantId,
            warehouseId: mainWarehouse.id,
            businessId: tenant,
            stock: 0,
            available: 0,
          },
        })

        const updated = await tx.variantStock.updateMany({
          where: {
            variantId,
            warehouseId: mainWarehouse.id,
            businessId: tenant,
            ...(type === "SALIDA" ? { stock: { gte: quantity } } : {}),
          },
          data: {
            stock:
              type === "AJUSTE"
                ? quantity
                : type === "ENTRADA"
                  ? { increment: quantity }
                  : { decrement: quantity },
            available:
              type === "AJUSTE"
                ? quantity
                : type === "ENTRADA"
                  ? { increment: quantity }
                  : { decrement: quantity },
          },
        })

        if (updated.count === 0) {
          throw new Error("Stock insuficiente para variante")
        }

        await tx.stockMovement.create({
          data: {
            businessId: tenant,
            productId,
            variantId,
            warehouseId: mainWarehouse.id,
            type,
            quantity,
            reason: reason || null,
            reference: reference || null,
            userId: session!.user.id,
          },
        })
      } else {
        let mainWarehouse = await tx.warehouse.findFirst({
          where: {
            branch: {
              businessId: tenant,
            },
            isMain: true,
            isActive: true,
          },
        })

        if (!mainWarehouse) {
          mainWarehouse = await tx.warehouse.findFirst({
            where: {
              branch: {
                businessId: tenant,
              },
              isActive: true,
            },
          })
        }

        if (!mainWarehouse) {
          throw new Error("No hay un almacén activo configurado")
        }

        const currentStockRecord = await tx.productStock.findUnique({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId: mainWarehouse.id,
            },
          },
        })

        const currentStock = currentStockRecord?.stock || 0
        const newStock =
          type === "ENTRADA"
            ? currentStock + quantity
            : type === "SALIDA"
              ? currentStock - quantity
              : quantity

        const finalStock = Math.max(0, newStock)

        await tx.productStock.upsert({
          where: {
            productId_warehouseId: {
              productId,
              warehouseId: mainWarehouse.id,
            },
          },
          create: {
            productId,
            warehouseId: mainWarehouse.id,
            stock: finalStock,
            available: finalStock,
          },
          update: {
            stock: finalStock,
            available: Math.max(0, finalStock - (currentStockRecord?.reserved || 0)),
          },
        })

        await tx.stockMovement.create({
          data: {
            businessId: tenant,
            productId,
            warehouseId: mainWarehouse.id,
            type,
            quantity,
            reason: reason || null,
            reference: reference || null,
            userId: session!.user.id,
          },
        })
      }

      return { success: true }
    })

    return NextResponse.json(movement, { status: 201 })
  } catch (error) {
    console.error("[API ERROR]", error)
    if (error instanceof Error && error.message.includes("almacén")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/products/stock-movements?productId=xxx - Historial de movimientos
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")
    const limit = parseInt(searchParams.get("limit") || "50")

    const movements = await prisma.stockMovement.findMany({
      where: {
        businessId: tenant,
        ...(productId && { productId }),
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json(movements)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
