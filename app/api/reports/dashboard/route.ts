import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyProductOwnership } from "@/lib/security/multi-tenant";

// GET /api/reports/dashboard - Dashboard con métricas principales
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    // Ventas de hoy
    const todaySales = await prisma.sale.aggregate({
      where: {
        createdAt: { gte: todayStart },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Ventas de ayer
    const yesterdaySales = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lt: todayStart,
        },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Ventas del mes
    const monthSales = await prisma.sale.aggregate({
      where: {
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Ventas del mes pasado
    const lastMonthSales = await prisma.sale.aggregate({
      where: {

        createdAt: {
          gte: lastMonthStart,
          lt: monthStart,
        },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Productos con bajo stock - filtrar en memoria
    const allProducts = await prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
      },
      select: {
        stock: true,
        minStock: true,
      },
    });
    const lowStockCount = allProducts.filter(p => p.stock <= p.minStock).length;

    // Clientes con deuda
    const clientsWithDebt = await prisma.client.count({
      where: {
        currentDebt: {
          gt: 0,
        },
      },
    });

    // Total deuda pendiente
    const totalDebt = await prisma.client.aggregate({
      where: {
        currentDebt: {
          gt: 0,
        },
      },
      _sum: {
        currentDebt: true,
      },
    });

    // Top 5 productos del día
    const topProductsToday = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: {
          createdAt: { gte: todayStart },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const topProductsWithNames = await Promise.all(
      topProductsToday.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true, businessId: true },
        });
        // Filtrar productos que no pertenecen al negocio
        if (product && product.businessId !== businessId) {
          return null;
        }
        return {
          name: product?.name || "Desconocido",
          sku: product?.sku || "",
          quantity: item._sum.quantity || 0,
          revenue: parseFloat((item._sum.subtotal || 0).toString()),
        };
      })
    ).then(results => results.filter(r => r !== null));

    // Últimas 5 ventas
    const recentSales = await prisma.sale.findMany({
      where: {},
      include: {
        client: {
          select: {
            name: true,
          },
        },
        saleItems: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Calcular comparaciones
    const todayVsYesterday = yesterdaySales._count.id > 0
      ? ((todaySales._count.id - yesterdaySales._count.id) / yesterdaySales._count.id) * 100
      : 0;

    const monthVsLastMonth = lastMonthSales._count.id > 0
      ? ((monthSales._count.id - lastMonthSales._count.id) / lastMonthSales._count.id) * 100
      : 0;

    return NextResponse.json({
      today: {
        sales: todaySales._count.id,
        revenue: parseFloat((todaySales._sum.total || 0).toString()),
        comparisonWithYesterday: Math.round(todayVsYesterday),
      },
      month: {
        sales: monthSales._count.id,
        revenue: parseFloat((monthSales._sum.total || 0).toString()),
        comparisonWithLastMonth: Math.round(monthVsLastMonth),
      },
      alerts: {
        lowStockProducts: lowStockCount,
        clientsWithDebt,
        totalPendingDebt: parseFloat((totalDebt._sum.currentDebt || 0).toString()),
      },
      topProductsToday: topProductsWithNames,
      recentSales: recentSales.map((sale) => ({
        id: sale.id,
        ticketNumber: sale.ticketNumber,
        total: parseFloat(sale.total.toString()),
        client: sale.client?.name || "Cliente anónimo",
        items: sale.saleItems.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: sale.paymentMethod,
        createdAt: sale.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("[GET /api/reports/dashboard]", error);
    return NextResponse.json(
      { error: "Error al cargar dashboard", details: error.message },
      { status: 500 }
    );
  }
}
