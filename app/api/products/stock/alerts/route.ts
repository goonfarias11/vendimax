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

    // Productos con stock por debajo del mínimo configurado
    const productsLowStock = await prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
        stock: {
          lte: prisma.product.fields.minStock, // stock <= minStock
        },
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        stock: "asc", // Los más críticos primero
      },
    });

    // Calcular nivel de alerta por producto
    const alerts = productsLowStock.map((product) => {
      const stockPercentage = product.minStock > 0 
        ? (product.stock / product.minStock) * 100 
        : 0;

      let severity: "critical" | "warning" | "low";
      if (product.stock === 0) {
        severity = "critical";
      } else if (stockPercentage < 50) {
        severity = "critical";
      } else if (stockPercentage < 100) {
        severity = "warning";
      } else {
        severity = "low";
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        minStock: product.minStock,
        maxStock: product.maxStock,
        unit: product.unit,
        category: product.category?.name || null,
        stockPercentage: Math.round(stockPercentage),
        severity,
        missing: Math.max(0, product.minStock - product.stock),
        recommendedOrder: product.maxStock 
          ? Math.max(0, product.maxStock - product.stock)
          : product.minStock * 2, // Sugerencia: ordenar el doble del mínimo
      };
    });

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
