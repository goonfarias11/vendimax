import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyProductOwnership } from "@/lib/security/multi-tenant";

// POST /api/products/stock-movements - Registrar movimiento de stock
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const { productId, variantId, type, quantity, reason, reference } = await req.json();

    // Validar tipo de movimiento
    const validTypes = ["ENTRADA", "SALIDA", "AJUSTE", "TRANSFERENCIA"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Tipo de movimiento inválido" }, { status: 400 });
    }

    // Verificar que el producto pertenezca al negocio
    await verifyProductOwnership(productId, businessId);

    // Validar que el producto exista
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId
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
        user: {
          select: {
            name: true,
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
      // Para productos simples, el stock vive en ProductStock del almacen principal.
      let mainWarehouse = await prisma.warehouse.findFirst({
        where: {
          branch: {
            businessId,
          },
          isMain: true,
          isActive: true,
        },
      });

      if (!mainWarehouse) {
        mainWarehouse = await prisma.warehouse.findFirst({
          where: {
            branch: {
              businessId,
            },
            isActive: true,
          },
        });
      }

      if (!mainWarehouse) {
        return NextResponse.json(
          { error: "No hay un almacén activo configurado" },
          { status: 400 }
        );
      }

      const currentStockRecord = await prisma.productStock.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId: mainWarehouse.id,
          },
        },
      });

      const currentStock = currentStockRecord?.stock || 0;
      const newStock =
        type === "ENTRADA"
          ? currentStock + quantity
          : type === "SALIDA"
          ? currentStock - quantity
          : quantity; // AJUSTE - nuevo valor absoluto

      const finalStock = Math.max(0, newStock);

      await prisma.productStock.upsert({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId: mainWarehouse.id,
          },
        },
        create: {
          productId,
          warehouseId: mainWarehouse.id,
          stock: finalStock,
          available: finalStock,
        },
        update: {
          stock: finalStock,
          available: Math.max(0, finalStock - (currentStockRecord?.reserved || 0)),
        },
      });
    }

    return NextResponse.json(movement, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/products/stock-movements]", error);
    
    if (error.status === 403) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
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

    const businessId = session.user.businessId;
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Validar que el producto pertenezca al negocio
    if (productId) {
      await verifyProductOwnership(productId, businessId);

      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          businessId
        },
      });

      if (!product) {
        return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where: {
        ...(productId && { productId }),
        ...(variantId && { /* variantId no existe en schema */ }),
      },
      include: {
        product: {
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
    
    if (error.status === 403) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: "Error al obtener movimientos", details: error.message },
      { status: 500 }
    );
  }
}
