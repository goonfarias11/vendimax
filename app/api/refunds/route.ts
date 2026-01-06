import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/refunds - Obtener todas las devoluciones con filtros
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // TOTAL o PARCIAL
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const refunds = await prisma.refund.findMany({
      where: {
        ...(type && { type: type as "TOTAL" | "PARCIAL" }),
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        sale: {
          select: {
            ticketNumber: true,
            total: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(refunds);
  } catch (error: any) {
    logger.error("Error al obtener devoluciones:", error);
    return NextResponse.json(
      { error: "Error al obtener devoluciones", details: error.message },
      { status: 500 }
    );
  }
}
