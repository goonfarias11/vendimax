import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupplierSchema } from "@/lib/validations/supplier";
import { logger } from "@/lib/logger";

// GET /api/suppliers - Listar proveedores
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        purchases: {
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
    });

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
    }));

    return NextResponse.json(formattedSuppliers);
  } catch (error: any) {
    logger.error("Error al obtener proveedores:", error);
    return NextResponse.json(
      { error: "Error al obtener proveedores", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Crear proveedor
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSupplierSchema.parse(body);

    // Verificar si ya existe un proveedor con el mismo email
    if (validatedData.email) {
      const existing = await prisma.supplier.findUnique({
        where: { email: validatedData.email },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Ya existe un proveedor con ese email" },
          { status: 400 }
        );
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        taxId: validatedData.taxId || null,
        notes: validatedData.notes || null,
      },
    });

    logger.info("Proveedor creado", { supplierId: supplier.id, userId: session.user.id });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    logger.error("Error al crear proveedor:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear proveedor", details: error.message },
      { status: 500 }
    );
  }
}
