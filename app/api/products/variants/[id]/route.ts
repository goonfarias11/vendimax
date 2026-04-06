import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireTenant } from "@/lib/security/tenant"
import { productVariantUpdateSchema } from "@/lib/validation/productVariant.schema"

// PUT /api/products/variants/[id] - Actualizar variante
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant
    const { id } = await params

    const parsed = productVariantUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 },
      )
    }
    const payload = parsed.data

    const variant = await prisma.productVariant.findFirst({
      where: {
        id,
        product: {
          businessId: tenant,
        },
      },
      include: {
        product: true,
      },
    })

    if (!variant) {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 })
    }

    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.attributes !== undefined && { attributes: payload.attributes }),
        ...(payload.sku !== undefined && { sku: payload.sku }),
        ...(payload.barcode !== undefined && { barcode: payload.barcode }),
        ...(payload.stock !== undefined && { stock: payload.stock }),
        ...(payload.cost !== undefined && { cost: payload.cost }),
        ...(payload.price !== undefined && { price: payload.price }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/products/variants/[id] - Eliminar variante
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) {
      return tenantResult.response
    }
    const tenant = tenantResult.tenant
    const { id } = await params

    const variant = await prisma.productVariant.findFirst({
      where: {
        id,
        product: {
          businessId: tenant,
        },
      },
    })

    if (!variant) {
      return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 })
    }

    await prisma.productVariant.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
