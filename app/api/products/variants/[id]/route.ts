import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyVariantOwnership } from "@/lib/security/multi-tenant";

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

    const businessId = session.user.businessId;

    // Verificar que la variante existe y pertenece al negocio
    await verifyVariantOwnership(id, businessId);

    const { name, attributes, sku, barcode, stock, cost, price } = await req.json();

    const variant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });
    }

    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(attributes !== undefined && { attributes }),
        ...(sku !== undefined && { sku }),
        ...(barcode !== undefined && { barcode }),
        ...(stock !== undefined && { stock }),
        ...(cost !== undefined && { cost }),
        ...(price !== undefined && { price }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PUT /api/products/variants/[id]]", error);
    
    if (error.status === 403) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
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

    const businessId = session.user.businessId;

    // Verificar que la variante existe y pertenece al negocio
    await verifyVariantOwnership(id, businessId);

    const variant = await prisma.productVariant.findUnique({
      where: { id },
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
    
    if (error.status === 403) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: "Error al eliminar variante", details: error.message },
      { status: 500 }
    );
  }
}
