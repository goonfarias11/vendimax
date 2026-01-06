import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPurchaseSchema } from "@/lib/validations/purchase";
import { logger } from "@/lib/logger";

// GET /api/purchases - Listar compras
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
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
              },
            },
          },
        },
        _count: {
          select: {
            purchaseItems: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedPurchases = purchases.map((purchase) => ({
      id: purchase.id,
      supplier: purchase.supplier,
      user: purchase.user,
      invoiceNum: purchase.invoiceNum,
      notes: purchase.notes,
      subtotal: Number(purchase.subtotal),
      tax: Number(purchase.tax),
      total: Number(purchase.total),
      itemsCount: purchase._count.purchaseItems,
      items: purchase.purchaseItems.map((item) => ({
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        cost: Number(item.cost),
        subtotal: Number(item.subtotal),
      })),
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    }));

    return NextResponse.json(formattedPurchases);
  } catch (error: any) {
    logger.error("Error al obtener compras:", error);
    return NextResponse.json(
      { error: "Error al obtener compras", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/purchases - Crear compra y recibir mercadería
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPurchaseSchema.parse(body);

    // Verificar que el proveedor existe
    const supplier = await prisma.supplier.findUnique({
      where: { id: validatedData.supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que todos los productos existen
    const productIds = validatedData.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Uno o más productos no fueron encontrados" },
        { status: 404 }
      );
    }

    // Crear compra y actualizar stock en una transacción
    const purchase = await prisma.$transaction(async (tx) => {
      // Crear la compra
      const newPurchase = await tx.purchase.create({
        data: {
          supplierId: validatedData.supplierId,
          userId: session.user.id,
          subtotal: validatedData.subtotal,
          tax: validatedData.tax,
          total: validatedData.total,
          invoiceNum: validatedData.invoiceNum || null,
          notes: validatedData.notes || null,
        },
      });

      // Crear los items y actualizar stock
      for (const item of validatedData.items) {
        // Crear item de compra
        await tx.purchaseItem.create({
          data: {
            purchaseId: newPurchase.id,
            productId: item.productId,
            quantity: item.quantity,
            cost: item.cost,
            subtotal: item.subtotal,
          },
        });

        // Actualizar stock del producto (incrementar)
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            cost: item.cost, // Actualizar costo con el último precio de compra
          },
        });

        // Registrar movimiento de stock
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "ENTRADA",
            quantity: item.quantity,
            reason: `Compra #${newPurchase.id} - ${supplier.name}`,
            reference: newPurchase.id,
            userId: session.user.id,
          },
        });
      }

      return newPurchase;
    });

    logger.info("Compra creada", {
      purchaseId: purchase.id,
      supplierId: validatedData.supplierId,
      userId: session.user.id,
      total: validatedData.total,
    });

    // Obtener la compra completa con relaciones
    const fullPurchase = await prisma.purchase.findUnique({
      where: { id: purchase.id },
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
              },
            },
          },
        },
      },
    });

    return NextResponse.json(fullPurchase, { status: 201 });
  } catch (error: any) {
    logger.error("Error al crear compra:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear compra", details: error.message },
      { status: 500 }
    );
  }
}
