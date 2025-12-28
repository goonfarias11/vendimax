import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/products - Reporte de productos más vendidos
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "20");

    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = {
        createdAt: {
          gte: start,
          lte: end,
        },
      };
    }

    // Productos más vendidos
    const topProducts = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: {
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
    });

    // Enriquecer con datos del producto
    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            businessId: true,
            name: true,
            sku: true,
            stock: true,
            price: true,
            cost: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!product || product.businessId !== businessId) return null;

        const revenue = parseFloat(item._sum.subtotal?.toString() || '0');
        const quantity = item._sum.quantity || 0;
        const costValue = parseFloat(product.cost.toString());
        const profit = revenue - (costValue * quantity);

        return {
          productId: item.productId,
          name: product.name,
          sku: product.sku,
          category: product.category?.name || "Sin categoría",
          stock: product.stock,
          price: parseFloat(product.price.toString()),
          cost: parseFloat(product.cost.toString()),
          quantitySold: quantity,
          revenue,
          profit,
          profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
          salesCount: item._count.id,
        };
      })
    );

    const validProducts = productsWithDetails.filter((p) => p !== null);

    // Productos con bajo stock - filtrar después ya que Prisma no soporta comparar columnas
    const allActiveProducts = await prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });
    
    const lowStockProducts = allActiveProducts
      .filter(p => p.stock <= p.minStock)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 20);

    // Productos sin ventas
    const productsWithoutSales = await prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
        saleItems: {
          none: {},
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
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
    });

    // Estadísticas generales
    const totalProducts = await prisma.product.count({
      where: {
        businessId,
        isActive: true,
      },
    });

    const totalRevenue = validProducts.reduce((sum, p) => sum + (p?.revenue || 0), 0);
    const totalProfit = validProducts.reduce((sum, p) => sum + (p?.profit || 0), 0);

    return NextResponse.json({
      period: startDate && endDate ? { start: startDate, end: endDate } : null,
      stats: {
        totalProducts,
        lowStockCount: lowStockProducts.length,
        withoutSalesCount: productsWithoutSales.length,
        totalRevenue,
        totalProfit,
        overallMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      },
      topProducts: validProducts,
      lowStockProducts,
      productsWithoutSales,
    });
  } catch (error: any) {
    console.error("[GET /api/reports/products]", error);
    return NextResponse.json(
      { error: "Error al generar reporte", details: error.message },
      { status: 500 }
    );
  }
}
