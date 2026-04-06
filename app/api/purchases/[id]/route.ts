import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"

// GET /api/purchases/[id] - Obtener detalle de compra
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant
    const { id } = await params

    const purchase = await prisma.purchase.findFirst({
      where: { id, businessId: tenant },
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
                price: true,
                businessId: true,
              },
            },
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    const formattedPurchase = {
      ...purchase,
      subtotal: Number(purchase.subtotal),
      tax: Number(purchase.tax),
      total: Number(purchase.total),
      purchaseItems: purchase.purchaseItems
        .filter((item) => item.product.businessId === tenant)
        .map((item) => ({
          ...item,
          cost: Number(item.cost),
          subtotal: Number(item.subtotal),
          product: {
            ...item.product,
            price: Number(item.product.price),
          },
        })),
    }

    return NextResponse.json(formattedPurchase)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/purchases/[id] - Anular compra (revertir stock)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant
    const { id } = await params

    const purchase = await prisma.purchase.findFirst({
      where: { id, businessId: tenant },
      include: {
        purchaseItems: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      for (const item of purchase.purchaseItems) {
        const productStock = await tx.productStock.findFirst({
          where: {
            productId: item.productId,
            ...(purchase.warehouseId ? { warehouseId: purchase.warehouseId } : {}),
          },
          orderBy: {
            createdAt: "asc",
          },
        })

        if (productStock) {
          await tx.productStock.update({
            where: { id: productStock.id },
            data: {
              stock: Math.max(0, productStock.stock - item.quantity),
              available: Math.max(0, productStock.available - item.quantity),
            },
          })
        }

        await tx.stockMovement.create({
          data: {
            businessId: tenant,
            productId: item.productId,
            type: "SALIDA",
            quantity: item.quantity,
            reason: `Anulación de compra #${purchase.id}`,
            reference: purchase.id,
            userId: session!.user.id,
          },
        })
      }

      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id },
      })

      await tx.purchase.delete({
        where: { id },
      })
    })

    return NextResponse.json({
      message: "Compra anulada y stock revertido",
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
