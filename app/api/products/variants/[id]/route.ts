import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/products/variants/[id] - Actualizar variante
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || !session.user.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { name, attributes, sku, barcode, stock, costPrice, salePrice } = await req.json();

    // Verificar que la variante existe y pertenece al negocio
    const variant = await prisma.productVariant.findFirst({
      where: {
        id,
        product: {
          userId: session.user.id,
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });
    }

    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        name,
        attributes,
        sku,
        barcode,
        stock,
        costPrice,
        salePrice,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PUT /api/products/variants/[id]]", error);
    return NextResponse.json(
      { error: "Error al actualizar variante", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/products/variants/[id] - Eliminar variante
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || !session.user.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la variante existe y pertenece al negocio
    const variant = await prisma.productVariant.findFirst({
      where: {
        id,
        product: {
          userId: session.user.id,
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });
    }

    await prisma.productVariant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/products/variants/[id]]", error);
    return NextResponse.json(
      { error: "Error al eliminar variante", details: error.message },
      { status: 500 }
    );
  }
}
