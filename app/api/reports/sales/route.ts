import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"

type SaleReportItem = {
  quantity: number
}

type SaleReportRow = {
  createdAt: Date
  total: number | string | { toString(): string }
  discount: number | string | { toString(): string }
  paymentMethod: string
  saleItems: SaleReportItem[]
}

type GroupedSalePeriod = {
  count: number
  total: number
  items: number
}

// GET /api/reports/sales - Reporte de ventas por período
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
    const groupBy = searchParams.get("groupBy") || "day" // day, week, month

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate y endDate son requeridos" }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        businessId: tenant,
        createdAt: {
          gte: start,
          lte: end,
        },
        status: "COMPLETADO",
      },
      include: {
        saleItems: {
          select: {
            quantity: true,
            subtotal: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    const stats = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0),
      totalDiscount: sales.reduce((sum, sale) => sum + parseFloat(sale.discount.toString()), 0),
      totalItems: sales.reduce(
        (sum, sale) => sum + sale.saleItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      ),
      averageTicket: 0,
    }
    stats.averageTicket = stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0

    const byPaymentMethod = sales.reduce<Record<string, { count: number; total: number }>>(
      (acc, sale) => {
        const method = sale.paymentMethod
        if (!acc[method]) {
          acc[method] = { count: 0, total: 0 }
        }
        acc[method].count++
        acc[method].total += parseFloat(sale.total.toString())
        return acc
      },
      {},
    )

    const groupedSales = groupSalesByPeriod(sales, groupBy)

    const topClients = await prisma.sale.groupBy({
      by: ["clientId"],
      where: {
        businessId: tenant,
        createdAt: {
          gte: start,
          lte: end,
        },
        clientId: {
          not: null,
        },
        status: "COMPLETADO",
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
      take: 5,
    })

    const topClientsWithNames = await Promise.all(
      topClients.map(async (item) => {
        if (!item.clientId) return null
        const client = await prisma.client.findFirst({
          where: { id: item.clientId, businessId: tenant },
          select: { name: true },
        })
        return {
          clientId: item.clientId,
          name: client?.name || "Desconocido",
          totalPurchases: item._sum.total || 0,
          salesCount: item._count.id,
        }
      }),
    )

    return NextResponse.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        groupBy,
      },
      stats,
      byPaymentMethod,
      groupedSales,
      topClients: topClientsWithNames.filter((c) => c !== null),
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function groupSalesByPeriod(sales: SaleReportRow[], groupBy: string) {
  const grouped: Record<string, GroupedSalePeriod> = {}

  sales.forEach((sale) => {
    const date = new Date(sale.createdAt)
    let key: string

    if (groupBy === "day") {
      key = date.toISOString().split("T")[0]
    } else if (groupBy === "week") {
      const week = getWeekNumber(date)
      key = `${date.getFullYear()}-W${week}`
    } else if (groupBy === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    } else {
      key = date.toISOString().split("T")[0]
    }

    if (!grouped[key]) {
      grouped[key] = { count: 0, total: 0, items: 0 }
    }

    grouped[key].count++
    grouped[key].total += parseFloat(sale.total.toString())
    grouped[key].items += sale.saleItems.reduce((sum, item) => sum + item.quantity, 0)
  })

  return Object.entries(grouped)
    .map(([date, data]) => ({
      date,
      ...data,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
