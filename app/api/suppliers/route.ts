import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { ZodError } from "zod"
import { requireTenant } from "@/lib/security/tenant"
import { supplierSchema } from "@/lib/validation/supplier.schema"

// GET /api/suppliers - Listar proveedores
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const isActive = searchParams.get("isActive")

    const where: Prisma.SupplierWhereInput = { businessId: tenant }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        purchases: {
          where: { businessId: tenant },
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            purchases: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    const formattedSuppliers = suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      taxId: supplier.taxId,
      notes: supplier.notes,
      isActive: supplier.isActive,
      purchaseCount: supplier._count.purchases,
      lastPurchase: supplier.purchases[0]?.createdAt || null,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
    }))

    return NextResponse.json(formattedSuppliers)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/suppliers - Crear proveedor
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const body = await request.json()
    const validatedData = supplierSchema.parse(body)

    if (validatedData.email) {
      const existing = await prisma.supplier.findFirst({
        where: { businessId: tenant, email: validatedData.email },
      })

      if (existing) {
        return NextResponse.json({ error: "Ya existe un proveedor con ese email" }, { status: 400 })
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        businessId: tenant,
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        taxId: validatedData.taxId || null,
        notes: validatedData.notes || null,
        isActive: validatedData.isActive ?? true,
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }

    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/suppliers?id=... - Actualizar proveedor
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = supplierSchema.partial().parse(body)

    const existingSupplier = await prisma.supplier.findFirst({
      where: { businessId: tenant, id },
      select: { id: true, email: true },
    })

    if (!existingSupplier) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    if (validatedData.email && validatedData.email !== existingSupplier.email) {
      const emailExists = await prisma.supplier.findFirst({
        where: { businessId: tenant, email: validatedData.email },
      })

      if (emailExists) {
        return NextResponse.json({ error: "Ya existe un proveedor con ese email" }, { status: 400 })
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(supplier)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }

    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
