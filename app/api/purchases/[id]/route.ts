import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/purchases/[id] - Obtener detalle de compra
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        purchaseItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                stock: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Compra no encontrada" },
        { status: 404 }
      );
    }

    const formattedPurchase = {
      ...purchase,
      subtotal: Number(purchase.subtotal),
      tax: Number(purchase.tax),
      total: Number(purchase.total),
      purchaseItems: purchase.purchaseItems.map((item) => ({
        ...item,
        cost: Number(item.cost),
        subtotal: Number(item.subtotal),
        product: {
          ...item.product,
          price: Number(item.product.price),
        },
      })),
    };

    return NextResponse.json(formattedPurchase);
  } catch (error: any) {
    logger.error("Error al obtener compra:", error);
    return NextResponse.json(
      { error: "Error al obtener compra", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/purchases/[id] - Anular compra (revertir stock)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la compra existe
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        purchaseItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Compra no encontrada" },
        { status: 404 }
      );
    }

    // Anular compra y revertir stock en transacción
    await prisma.$transaction(async (tx) => {
      // Revertir stock de cada producto
      for (const item of purchase.purchaseItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        // Registrar movimiento de stock
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "SALIDA",
            quantity: item.quantity,
            reason: `Anulación de compra #${purchase.id}`,
            reference: purchase.id,
            userId: session.user.id,
          },
        });
      }

      // Eliminar items de compra
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id },
      });

      // Eliminar compra
      await tx.purchase.delete({
        where: { id },
      });
    });

    logger.info("Compra anulada", {
      purchaseId: id,
      userId: session.user.id,
    });

    return NextResponse.json({
      message: "Compra anulada y stock revertido",
    });
  } catch (error: any) {
    logger.error("Error al anular compra:", error);
    return NextResponse.json(
      { error: "Error al anular compra", details: error.message },
      { status: 500 }
    );
  }
}
