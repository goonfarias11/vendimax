import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/products/stock-movements - Registrar movimiento de stock
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { productId, variantId, type, quantity, reason, reference } = await req.json();

    // Validar tipo de movimiento
    const validTypes = ["ENTRADA", "SALIDA", "AJUSTE", "TRANSFERENCIA"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Tipo de movimiento inválido" }, { status: 400 });
    }

    // Validar que el producto exista
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Si es variante, validar que exista
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          id: variantId,
          productId,
        },
      });

      if (!variant) {
        return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });
      }
    }

    // Crear movimiento de stock
    const movement = await prisma.stockMovement.create({
      data: {
        productId,
        variantId: variantId || null,
        type,
        quantity,
        reason: reason || null,
        reference: reference || null,
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        variant: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    });

    // Actualizar stock del producto o variante
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });

      if (variant) {
        const newStock =
          type === "ENTRADA"
            ? variant.stock + quantity
            : type === "SALIDA"
            ? variant.stock - quantity
            : quantity; // AJUSTE - nuevo valor absoluto

        await prisma.productVariant.update({
          where: { id: variantId },
          data: { stock: Math.max(0, newStock) },
        });
      }
    } else {
      const newStock =
        type === "ENTRADA"
          ? product.stock + quantity
          : type === "SALIDA"
          ? product.stock - quantity
          : quantity; // AJUSTE - nuevo valor absoluto

      await prisma.product.update({
        where: { id: productId },
        data: { stock: Math.max(0, newStock) },
      });
    }

    return NextResponse.json(movement, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/products/stock-movements]", error);
    return NextResponse.json(
      { error: "Error al registrar movimiento", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/products/stock-movements?productId=xxx - Historial de movimientos
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Validar que el producto pertenezca al negocio
    if (productId) {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
        },
      });

      if (!product) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where: {
        productId: productId || undefined,
        variantId: variantId || undefined,
        product: {
          userId: session.user.id,
        },
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        variant: {
          select: {
            name: true,
            sku: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(movements);
  } catch (error: any) {
    console.error("[GET /api/products/stock-movements]", error);
    return NextResponse.json(
      { error: "Error al obtener movimientos", details: error.message },
      { status: 500 }
    );
  }
}
