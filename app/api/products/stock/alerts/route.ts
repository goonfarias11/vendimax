import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/products/stock/alerts - Obtener productos con stock bajo
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const { searchParams } = new URL(req.url);
    const threshold = searchParams.get("threshold"); // Opcional: porcentaje custom (ej: 20%)
    const warningThreshold = Number.isFinite(Number(threshold))
      ? Number(threshold)
      : 100;

    // El stock real vive en ProductStock (puede haber varios almacenes por producto).
    const stockRows = await prisma.productStock.findMany({
      where: {
        warehouse: {
          branch: {
            businessId,
          },
        },
        product: {
          businessId,
          isActive: true,
        },
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        stock: "asc",
      },
    });

    const stockByProduct = new Map<
      string,
      {
        product: (typeof stockRows)[number]["product"];
        totalStock: number;
      }
    >();

    for (const row of stockRows) {
      const current = stockByProduct.get(row.productId);
      if (current) {
        current.totalStock += row.stock;
      } else {
        stockByProduct.set(row.productId, {
          product: row.product,
          totalStock: row.stock,
        });
      }
    }

    // Calcular alertas por producto en base al stock total.
    const alerts = Array.from(stockByProduct.values())
      .filter(({ product, totalStock }) => product.minStock > 0 && totalStock <= product.minStock)
      .map(({ product, totalStock }) => {
      const stockPercentage = product.minStock > 0
        ? (totalStock / product.minStock) * 100
        : 0;

      let severity: "critical" | "warning" | "low";
      if (totalStock === 0) {
        severity = "critical";
      } else if (stockPercentage < 50) {
        severity = "critical";
      } else if (stockPercentage < warningThreshold) {
        severity = "warning";
      } else {
        severity = "low";
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: totalStock,
        minStock: product.minStock,
        maxStock: product.maxStock,
        unit: product.unit,
        category: product.category?.name || null,
        stockPercentage: Math.round(stockPercentage),
        severity,
        missing: Math.max(0, product.minStock - totalStock),
        recommendedOrder: product.maxStock 
          ? Math.max(0, product.maxStock - totalStock)
          : product.minStock * 2, // Sugerencia: ordenar el doble del mínimo
      };
    })
      .sort((a, b) => a.stock - b.stock);

    // Estadísticas generales
    const stats = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      outOfStock: alerts.filter((a) => a.stock === 0).length,
      totalMissingUnits: alerts.reduce((sum, a) => sum + a.missing, 0),
    };

    return NextResponse.json({
      alerts,
      stats,
    });
  } catch (error: any) {
    console.error("[GET /api/products/stock/alerts]", error);
    return NextResponse.json(
      { error: "Error al obtener alertas", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/products/stock/alerts/notify - Enviar notificaciones de stock bajo (futuro)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // TODO: Implementar envío de emails/notificaciones
    // - Obtener productos con stock crítico
    // - Enviar email al admin/responsable de compras
    // - Registrar en audit log

    return NextResponse.json({
      message: "Notificaciones enviadas (funcionalidad en desarrollo)",
    });
  } catch (error: any) {
    console.error("[POST /api/products/stock/alerts/notify]", error);
    return NextResponse.json(
      { error: "Error al enviar notificaciones", details: error.message },
      { status: 500 }
    );
  }
}
