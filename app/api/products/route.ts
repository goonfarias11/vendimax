import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { requireBusinessId, verifyProductOwnership } from "@/lib/security/multi-tenant"
import { requirePermission } from "@/lib/auth-middleware"

export const runtime = 'nodejs'

const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres"),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().positive("El precio debe ser mayor a 0"),
  cost: z.number().positive("El costo debe ser mayor a 0"),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
  minStock: z.number().int().min(0, "El stock mínimo no puede ser negativo"),
  maxStock: z.number().int().positive().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).default(21),
})

export async function GET(request: NextRequest) {
  try {
    // Verificar permiso para ver productos
    const permissionCheck = await requirePermission(request, 'products:view')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    if (!session.user.businessId) {
      return NextResponse.json({ 
        error: "Usuario sin negocio asignado. Por favor, contacta al administrador.",
        details: "businessId is missing from session"
      }, { status: 403 })
    }

    const businessId = session.user.businessId

    const products = await prisma.product.findMany({
      where: {
        businessId,
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formatted = products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      description: p.description,
      price: Number(p.price),
      cost: Number(p.cost),
      stock: p.stock,
      minStock: p.minStock,
      maxStock: p.maxStock,
      categoryId: p.categoryId,
      category: p.category,
      image: p.image,
      unit: p.unit,
      taxRate: Number(p.taxRate),
      isActive: p.isActive
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ 
      error: "Error al cargar productos",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar permiso para crear productos
    const permissionCheck = await requirePermission(request, 'products:create')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const businessId = session.user.businessId

    const body = await request.json()
    const validatedData = productSchema.parse(body)

    // Verificar si el SKU ya existe en este negocio
    const existingSku = await prisma.product.findFirst({
      where: { 
        businessId,
        sku: validatedData.sku 
      }
    })

    if (existingSku) {
      return NextResponse.json(
        { error: "El SKU ya está en uso" },
        { status: 400 }
      )
    }

    // Verificar si el barcode ya existe en este negocio (si se proporciona)
    if (validatedData.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { 
          businessId,
          barcode: validatedData.barcode 
        }
      })

      if (existingBarcode) {
        return NextResponse.json(
          { error: "El código de barras ya está en uso" },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        businessId
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const businessId = session.user.businessId

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID de producto requerido" },
        { status: 400 }
      )
    }

    // Verificar que el producto pertenezca al negocio
    await verifyProductOwnership(id, businessId)

    const body = await request.json()
    const validatedData = productSchema.parse(body)

    // Verificar si el SKU ya está en uso por otro producto del mismo negocio
    const existingSku = await prisma.product.findFirst({
      where: {
        businessId,
        sku: validatedData.sku,
        id: { not: id }
      }
    })

    if (existingSku) {
      return NextResponse.json(
        { error: "El SKU ya está en uso" },
        { status: 400 }
      )
    }

    const product = await prisma.product.update({
      where: { id },
      data: validatedData,
      include: {
        category: true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const businessId = session.user.businessId

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID de producto requerido" },
        { status: 400 }
      )
    }

    // Verificar que el producto pertenezca al negocio
    await verifyProductOwnership(id, businessId)

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 })
  }
}

