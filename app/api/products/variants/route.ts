import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"
import { productVariantSchema } from "@/lib/validation/productVariant.schema"

// POST /api/products/variants - Crear variante de producto
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant

    const parsed = productVariantSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 },
      )
    }
    const { productId, name, attributes, sku, barcode, stock, price, cost } = parsed.data

    const product = await prisma.product.findFirst({
      where: { id: productId, businessId: tenant },
    })

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const variant = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId, businessId: tenant },
        data: { hasVariants: true },
      })

      return tx.productVariant.create({
        data: {
          productId,
          name,
          attributes: attributes || {},
          sku,
          barcode: barcode || null,
          stock: stock || 0,
          cost: cost ?? product.cost,
          price: price ?? product.price,
        },
      })
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/products/variants?productId=xxx - Listar variantes de un producto
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, businessId: tenant },
    })

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId, product: { businessId: tenant } },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(variants)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
