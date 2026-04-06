import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { requireTenant } from "@/lib/security/tenant"

// GET /api/reports/sellers - Reporte de desempeño por vendedor
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

    let dateFilter: Prisma.SaleWhereInput = {}
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

    const salesBySeller = await prisma.sale.groupBy({
      by: ["userId"],
      where: {
        businessId: tenant,
        status: "COMPLETADO",
        ...dateFilter,
      },
      _sum: {
        total: true,
        discount: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        total: true,
      },
    })

    const sellersWithDetails = await Promise.all(
      salesBySeller.map(async (item) => {
        const user = await prisma.user.findFirst({
          where: { id: item.userId, businessId: tenant },
          select: {
            name: true,
            email: true,
            role: true,
          },
        })

        if (!user) return null

        const sales = await prisma.sale.findMany({
          where: {
            businessId: tenant,
            userId: item.userId,
            status: "COMPLETADO",
            ...dateFilter,
          },
          select: {
            paymentMethod: true,
            saleItems: {
              select: {
                quantity: true,
              },
            },
          },
        })

        const totalItems = sales.reduce(
          (sum, sale) => sum + sale.saleItems.reduce((s, item) => s + item.quantity, 0),
          0,
        )

        const paymentMethods = sales.reduce<Record<string, number>>((acc, sale) => {
          const method = sale.paymentMethod
          acc[method] = (acc[method] || 0) + 1
          return acc
        }, {})

        return {
          userId: item.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          totalSales: item._count.id,
          totalRevenue: parseFloat((item._sum.total || 0).toString()),
          totalDiscount: parseFloat((item._sum.discount || 0).toString()),
          averageTicket: parseFloat((item._avg.total || 0).toString()),
          totalItems,
          paymentMethods,
        }
      }),
    )

    const validSellers = sellersWithDetails.flatMap((seller) => (seller ? [seller] : []))

    validSellers.sort((a, b) => b.totalRevenue - a.totalRevenue)

    const totals = {
      totalSales: validSellers.reduce((sum, s) => sum + s.totalSales, 0),
      totalRevenue: validSellers.reduce((sum, s) => sum + s.totalRevenue, 0),
      totalDiscount: validSellers.reduce((sum, s) => sum + s.totalDiscount, 0),
      totalItems: validSellers.reduce((sum, s) => sum + s.totalItems, 0),
    }

    return NextResponse.json({
      period: startDate && endDate ? { start: startDate, end: endDate } : null,
      totals,
      sellers: validSellers,
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
