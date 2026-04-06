import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-middleware"

// API de mÃ©tricas del dashboard (multi-tenant)
// Consolida KPIs crÃ­ticos en el backend para evitar filtrado y cÃ¡lculo en el cliente.

export const runtime = "nodejs"

type SeriesPoint = {
  date: string
  total: number
  tickets: number
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function GET(request: NextRequest) {
  try {
    // Permitir acceso a roles con permisos de reportes o POS
    const permissionCheck = await requirePermission(request, [
      "reports:view_basic",
      "reports:view_all",
      "pos:access",
    ])
    if (!permissionCheck.authorized) return permissionCheck.response!

    const session = await auth()
    const businessId = session?.user?.businessId
    if (!businessId) {
      return NextResponse.json(
        { error: "No autenticado o sin negocio asociado" },
        { status: 401 }
      )
    }

    const now = new Date()
    const startToday = startOfDay(now)
    const startMonth = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
    const last30 = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29))

    // Totales del dÃ­a y del mes (ventas completadas)
    const [todayAgg, monthAgg, pendingCount] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        where: {
          businessId,
          status: "COMPLETADO",
          createdAt: { gte: startToday },
        },
      }),
      prisma.sale.aggregate({
        _sum: { total: true },
        _count: { _all: true },
        where: {
          businessId,
          status: "COMPLETADO",
          createdAt: { gte: startMonth },
        },
      }),
      prisma.sale.count({
        where: { businessId, status: "PENDIENTE" },
      }),
    ])

    // Serie Ãºltimos 30 dÃ­as
    const salesLast30 = await prisma.sale.findMany({
      where: {
        businessId,
        status: "COMPLETADO",
        createdAt: { gte: last30 },
      },
      select: {
        createdAt: true,
        total: true,
      },
    })

    const seriesMap = new Map<string, SeriesPoint>()
    for (let i = 0; i < 30; i++) {
      const day = startOfDay(new Date(last30.getTime() + i * 86400000))
      const key = formatDateKey(day)
      seriesMap.set(key, { date: key, total: 0, tickets: 0 })
    }

    salesLast30.forEach((sale) => {
      const key = formatDateKey(startOfDay(sale.createdAt))
      const point = seriesMap.get(key)
      if (point) {
        point.total += Number(sale.total || 0)
        point.tickets += 1
        seriesMap.set(key, point)
      }
    })

    const salesSeries = Array.from(seriesMap.values())

    // Productos con bajo stock (usa sumatoria de stock por productStocks)
    const productsWithStock = await prisma.product.findMany({
      where: { businessId, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        minStock: true,
        productStocks: { select: { available: true } },
      },
    })

    const lowStock = productsWithStock
      .map((p) => {
        const available = p.productStocks.reduce((sum, ps) => sum + Number(ps.available || 0), 0)
        return { id: p.id, name: p.name, sku: p.sku, available, minStock: p.minStock }
      })
      .filter((p) => p.available <= p.minStock)
      .sort((a, b) => a.available - b.available)
      .slice(0, 10)

    // Top productos por cantidad (Ãºltimos 30 dÃ­as)
    const topProductsRaw = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: {
          businessId,
          status: "COMPLETADO",
          createdAt: { gte: last30 },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: { quantity: "desc" },
      },
      take: 5,
    })

    const productIds = topProductsRaw.map((p) => p.productId)
    const productNames = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    })
    const nameMap = new Map(productNames.map((p) => [p.id, p]))

    const topProducts = topProductsRaw.map((p) => ({
      productId: p.productId,
      name: nameMap.get(p.productId)?.name || "Producto",
      sku: nameMap.get(p.productId)?.sku || "",
      quantity: Number(p._sum.quantity || 0),
      total: Number(p._sum.subtotal || 0),
    }))

    // Ãšltimas ventas (para tarjetas de actividad)
    const recentSales = await prisma.sale.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        ticketNumber: true,
        total: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        client: { select: { name: true } },
      },
    })

    return NextResponse.json({
      kpis: {
        salesToday: Number(todayAgg._sum.total || 0),
        ticketsToday: todayAgg._count._all,
        salesMonth: Number(monthAgg._sum.total || 0),
        ticketsMonth: monthAgg._count._all,
        pendingSales: pendingCount,
        lowStock: lowStock.length,
      },
      lowStock,
      topProducts,
      salesSeries,
      recentSales: recentSales.map((s) => ({
        id: s.id,
        ticketNumber: s.ticketNumber,
        client: s.client?.name || "Sin cliente",
        total: Number(s.total || 0),
        status: s.status,
        paymentMethod: s.paymentMethod,
        createdAt: s.createdAt,
      })),
    })
  } catch (error) {
    console.error("[dashboard/metrics]", error)
    return NextResponse.json({ error: "No se pudieron cargar las mÃ©tricas" }, { status: 500 })
  }
}
