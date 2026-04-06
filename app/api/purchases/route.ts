import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"
import { purchaseSchema } from "@/lib/validation/purchase.schema"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"

// GET /api/purchases - Listar compras
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = (searchParams.get("search") || "").trim()

    const where: Prisma.PurchaseWhereInput = {
      businessId: tenant,
    }

    if (supplierId) {
      where.supplierId = supplierId
    }

    if (startDate || endDate) {
      const createdAt: Prisma.DateTimeFilter = {}
      if (startDate) createdAt.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        createdAt.lte = end
      }
      where.createdAt = createdAt
    }

    if (search) {
      where.OR = [
        {
          supplier: {
            name: {
              contains: search,
              mode: "insensitive",
            },
            businessId: tenant,
          },
        },
        {
          invoiceNum: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          purchaseItems: {
            some: {
              product: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
                businessId: tenant,
              },
            },
          },
        },
      ]
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: {
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
        purchaseItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                businessId: true,
              },
            },
          },
        },
        _count: {
          select: {
            purchaseItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedPurchases = purchases.map((purchase) => ({
      id: purchase.id,
      supplier: purchase.supplier,
      user: purchase.user,
      invoiceNum: purchase.invoiceNum,
      notes: purchase.notes,
      subtotal: Number(purchase.subtotal),
      tax: Number(purchase.tax),
      total: Number(purchase.total),
      itemsCount: purchase._count.purchaseItems,
      items: purchase.purchaseItems
        .filter((item) => item.product.businessId === tenant)
        .map((item) => ({
          id: item.id,
          product: {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
          },
          quantity: item.quantity,
          cost: Number(item.cost),
          subtotal: Number(item.subtotal),
        })),
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    }))

    return NextResponse.json(formattedPurchases)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/purchases - Crear compra y recibir mercadería
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant

    const parsed = purchaseSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 },
      )
    }
    const validatedData = parsed.data

    const supplier = await prisma.supplier.findFirst({
      where: { id: validatedData.supplierId, businessId: tenant },
    })

    if (!supplier) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    const productIds = validatedData.items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        businessId: tenant,
        id: { in: productIds },
      },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Uno o más productos no fueron encontrados" },
        { status: 404 },
      )
    }

    const purchase = await prisma.$transaction(async (tx) => {
      const businessId = tenant

      let mainWarehouse = await tx.warehouse.findFirst({
        where: {
          branch: {
            businessId,
          },
          isMain: true,
          isActive: true,
        },
      })

      if (!mainWarehouse) {
        mainWarehouse = await tx.warehouse.findFirst({
          where: {
            branch: {
              businessId,
            },
            isActive: true,
          },
        })
      }

      if (!mainWarehouse) {
        let mainBranch = await tx.branch.findFirst({
          where: {
            businessId,
            isMain: true,
          },
        })

        if (!mainBranch) {
          mainBranch = await tx.branch.create({
            data: {
              businessId,
              name: "Sucursal Principal",
              code: "MAIN",
              isMain: true,
              isActive: true,
            },
          })
        }

        mainWarehouse = await tx.warehouse.create({
          data: {
            branchId: mainBranch.id,
            name: "Almacen Principal",
            code: "MAIN",
            isMain: true,
            isActive: true,
          },
        })
      }

      const newPurchase = await tx.purchase.create({
        data: {
          businessId,
          supplierId: validatedData.supplierId,
          userId: session!.user.id,
          warehouseId: mainWarehouse.id,
          subtotal: validatedData.subtotal,
          tax: validatedData.tax,
          total: validatedData.total,
          invoiceNum: validatedData.invoiceNum || null,
          notes: validatedData.notes || null,
        },
      })

      for (const item of validatedData.items) {
        await tx.purchaseItem.create({
          data: {
            purchaseId: newPurchase.id,
            productId: item.productId,
            quantity: item.quantity,
            cost: item.cost,
            subtotal: item.subtotal,
          },
        })

        await tx.product.update({
          where: { id: item.productId, businessId },
          data: {
            cost: item.cost,
          },
        })

        await tx.productStock.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: mainWarehouse.id,
            },
          },
          create: {
            productId: item.productId,
            warehouseId: mainWarehouse.id,
            stock: item.quantity,
            available: item.quantity,
          },
          update: {
            stock: { increment: item.quantity },
            available: { increment: item.quantity },
          },
        })

        await tx.stockMovement.create({
          data: {
            businessId,
            productId: item.productId,
            type: "ENTRADA",
            quantity: item.quantity,
            reason: `Compra #${newPurchase.id} - ${supplier.name}`,
            reference: newPurchase.id,
            userId: session!.user.id,
          },
        })
      }

      return newPurchase
    })

    const fullPurchase = await prisma.purchase.findFirst({
      where: { id: purchase.id, businessId: tenant },
      include: {
        supplier: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        purchaseItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                businessId: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(fullPurchase, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      )
    }

    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
