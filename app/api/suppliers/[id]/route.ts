import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSupplierSchema } from "@/lib/validations/supplier";
import { logger } from "@/lib/logger";

// GET /api/suppliers/[id] - Obtener detalle de proveedor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            purchaseItems: {
              include: {
                product: {
                  select: {
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    // Calcular estadísticas
    const totalPurchased = supplier.purchases.reduce(
      (sum, p) => sum + Number(p.total),
      0
    );

    const formattedSupplier = {
      ...supplier,
      totalPurchased,
      purchases: supplier.purchases.map((p) => ({
        ...p,
        total: Number(p.total),
        subtotal: Number(p.subtotal),
        tax: Number(p.tax),
        purchaseItems: p.purchaseItems.map((item) => ({
          ...item,
          cost: Number(item.cost),
          subtotal: Number(item.subtotal),
        })),
      })),
    };

    return NextResponse.json(formattedSupplier);
  } catch (error: any) {
    logger.error("Error al obtener proveedor:", error);
    return NextResponse.json(
      { error: "Error al obtener proveedor", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/suppliers/[id] - Actualizar proveedor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSupplierSchema.parse(body);

    // Verificar que el proveedor existe
    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    // Verificar email único si se está actualizando
    if (validatedData.email && validatedData.email !== existing.email) {
      const emailExists = await prisma.supplier.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Ya existe un proveedor con ese email" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: validatedData,
    });

    logger.info("Proveedor actualizado", { supplierId: id, userId: session.user.id });

    return NextResponse.json(updated);
  } catch (error: any) {
    logger.error("Error al actualizar proveedor:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar proveedor", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] - Eliminar/desactivar proveedor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que existe
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      );
    }

    // Si tiene compras, solo desactivar (soft delete)
    if (supplier._count.purchases > 0) {
      const updated = await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      });

      logger.info("Proveedor desactivado", { supplierId: id, userId: session.user.id });

      return NextResponse.json({
        message: "Proveedor desactivado",
        supplier: updated,
      });
    }

    // Si no tiene compras, eliminar permanentemente
    await prisma.supplier.delete({
      where: { id },
    });

    logger.info("Proveedor eliminado", { supplierId: id, userId: session.user.id });

    return NextResponse.json({ message: "Proveedor eliminado" });
  } catch (error: any) {
    logger.error("Error al eliminar proveedor:", error);
    return NextResponse.json(
      { error: "Error al eliminar proveedor", details: error.message },
      { status: 500 }
    );
  }
}
