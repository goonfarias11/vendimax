import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/clients/[id]/history - Historial de compras del cliente
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verificar que el cliente pertenezca al negocio
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Obtener ventas del cliente
    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where: { clientId: id },
        include: {
          saleItems: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.sale.count({
        where: { clientId: id },
      }),
    ]);

    // Calcular estadísticas
    const stats = await prisma.sale.aggregate({
      where: { clientId: id },
      _sum: {
        total: true,
        discount: true,
      },
      _avg: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    // Productos más comprados
    const topProducts = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: {
          clientId: id,
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

    // Enriquecer productos más comprados con nombres
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true },
        });
        return {
          productId: item.productId,
          name: product?.name || "Desconocido",
          sku: product?.sku || "",
          totalQuantity: item._sum.quantity || 0,
          totalAmount: item._sum.subtotal || 0,
        };
      })
    );

    return NextResponse.json({
      sales,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      stats: {
        totalSales: stats._count.id,
        totalAmount: stats._sum.total || 0,
        totalDiscount: stats._sum.discount || 0,
        averageTicket: stats._avg.total || 0,
      },
      topProducts: topProductsWithNames,
    });
  } catch (error: any) {
    console.error("[GET /api/clients/[id]/history]", error);
    return NextResponse.json(
      { error: "Error al obtener historial", details: error.message },
      { status: 500 }
    );
  }
}
