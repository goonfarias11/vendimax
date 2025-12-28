import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyProductOwnership } from "@/lib/security/multi-tenant";

// POST /api/products/variants - Crear variante de producto
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const { productId, name, attributes, sku, barcode, stock, price, cost } = await req.json();

    // Verificar que el producto exista y pertenezca al negocio
    await verifyProductOwnership(productId, businessId);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Actualizar producto para indicar que tiene variantes
    await prisma.product.update({
      where: { id: productId },
      data: { hasVariants: true },
    });

    // Crear variante
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name,
        attributes: attributes || {},
        sku: sku || null,
        barcode: barcode || null,
        stock: stock || 0,
        cost: cost || product.cost,
        price: price || product.price,
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/products/variants]", error);
    
    if (error.status === 403) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: "Error al crear variante", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/products/variants?productId=xxx - Listar variantes de un producto
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }

    // Verificar que el producto exista y pertenezca al negocio
    await verifyProductOwnership(productId, businessId);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(variants);
  } catch (error: any) {
    console.error("[GET /api/products/variants]", error);
    
    if (error.status === 403) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: "Error al obtener variantes", details: error.message },
      { status: 500 }
    );
  }
}
