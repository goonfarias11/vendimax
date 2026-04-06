import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"

// GET /api/reports/products - Reporte de productos más vendidos
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = parseInt(searchParams.get("limit") || "20")

    const stockRows = await prisma.productStock.findMany({
      where: {
        warehouse: {
          branch: {
            businessId: tenant,
          },
        },
        product: {
          businessId: tenant,
        },
      },
      select: {
        productId: true,
        stock: true,
      },
    })

    const stockByProduct = new Map<string, number>()
    for (const row of stockRows) {
      stockByProduct.set(row.productId, (stockByProduct.get(row.productId) || 0) + row.stock)
    }

    let dateFilter = {}
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter = {
        createdAt: {
          gte: start,
          lte: end,
        },
      }
    }

    const topProducts = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: {
          businessId: tenant,
          ...dateFilter,
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
    })

    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findFirst({
          where: { id: item.productId, businessId: tenant },
          select: {
            name: true,
            sku: true,
            price: true,
            cost: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        })

        if (!product) return null

        const revenue = parseFloat(item._sum.subtotal?.toString() || "0")
        const quantity = item._sum.quantity || 0
        const costValue = parseFloat(product.cost.toString())
        const profit = revenue - costValue * quantity

        return {
          productId: item.productId,
          name: product.name,
          sku: product.sku,
          category: product.category?.name || "Sin categoría",
          stock: stockByProduct.get(item.productId) || 0,
          price: parseFloat(product.price.toString()),
          cost: parseFloat(product.cost.toString()),
          quantitySold: quantity,
          revenue,
          profit,
          profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
          salesCount: item._count.id,
        }
      }),
    )

    const validProducts = productsWithDetails.filter((p) => p !== null)

    const allActiveProducts = await prisma.product.findMany({
      where: {
        businessId: tenant,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        minStock: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    })

    const lowStockProducts = allActiveProducts
      .map((p) => ({
        ...p,
        stock: stockByProduct.get(p.id) || 0,
      }))
      .filter((p) => p.stock <= p.minStock)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 20)

    const productsWithoutSales = await prisma.product.findMany({
      where: {
        businessId: tenant,
        isActive: true,
        saleItems: {
          none: {},
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        createdAt: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    })

    const totalProducts = await prisma.product.count({
      where: {
        businessId: tenant,
        isActive: true,
      },
    })

    const totalRevenue = validProducts.reduce((sum, p) => sum + (p?.revenue || 0), 0)
    const totalProfit = validProducts.reduce((sum, p) => sum + (p?.profit || 0), 0)

    const productsWithoutSalesWithStock = productsWithoutSales.map((product) => ({
      ...product,
      stock: stockByProduct.get(product.id) || 0,
    }))

    return NextResponse.json({
      period: startDate && endDate ? { start: startDate, end: endDate } : null,
      stats: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        withoutSalesCount: productsWithoutSalesWithStock.length,
        totalRevenue,
        totalProfit,
        overallMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      },
      topProducts: validProducts,
      lowStockProducts,
      productsWithoutSales: productsWithoutSalesWithStock,
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
