import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reports/sellers - Reporte de desempeño por vendedor
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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

    // Ventas por vendedor
    const salesBySeller = await prisma.sale.groupBy({
      by: ["userId"],
      where: {
        userId: session.user.id,
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
    });

    // Enriquecer con datos del vendedor
    const sellersWithDetails = await Promise.all(
      salesBySeller.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: {
            name: true,
            email: true,
            role: true,
          },
        });

        if (!user) return null;

        // Obtener todas las ventas del vendedor para calcular más métricas
        const sales = await prisma.sale.findMany({
          where: {
            userId: item.userId,
            ...dateFilter,
          },
          include: {
            saleItems: {
              select: {
                quantity: true,
              },
            },
          },
        });

        const totalItems = sales.reduce(
          (sum, sale) => sum + sale.saleItems.reduce((s, item) => s + item.quantity, 0),
          0
        );

        // Métodos de pago utilizados
        const paymentMethods = sales.reduce((acc: any, sale) => {
          const method = sale.paymentMethod;
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        }, {});

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
        };
      })
    );

    const validSellers = sellersWithDetails.filter((s) => s !== null);

    // Ordenar por revenue
    validSellers.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calcular totales
    const totals = {
      totalSales: validSellers.reduce((sum, s) => sum + s.totalSales, 0),
      totalRevenue: validSellers.reduce((sum, s) => sum + s.totalRevenue, 0),
      totalDiscount: validSellers.reduce((sum, s) => sum + s.totalDiscount, 0),
      totalItems: validSellers.reduce((sum, s) => sum + s.totalItems, 0),
    };

    return NextResponse.json({
      period: startDate && endDate ? { start: startDate, end: endDate } : null,
      totals,
      sellers: validSellers,
    });
  } catch (error: any) {
    console.error("[GET /api/reports/sellers]", error);
    return NextResponse.json(
      { error: "Error al generar reporte", details: error.message },
      { status: 500 }
    );
  }
}
