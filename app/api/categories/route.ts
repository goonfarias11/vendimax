import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withBusinessScope } from '@/lib/security/multi-tenant';
import { requireTenant } from '@/lib/security/tenant';
import { categorySchema } from '@/lib/validation/category.schema';

// GET - Listar categorías
export async function GET() {
  try {
    const session = await auth();
    const tenantResult = await requireTenant(session);
    if (!tenantResult.authorized) return tenantResult.response;

    const categories = await prisma.category.findMany({
      where: { businessId: tenantResult.tenant, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error en GET /api/categories:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

// POST - Crear categoría
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const tenantResult = await requireTenant(session);
    if (!tenantResult.authorized) return tenantResult.response;

    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        businessId: tenantResult.tenant,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/categories:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar categoría
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const tenantResult = await requireTenant(session);
    if (!tenantResult.authorized) return tenantResult.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de categoría requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const existingCategory = await prisma.category.findFirst({
      where: { businessId: tenantResult.tenant, id },
      select: { id: true },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error en PUT /api/categories:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar categoría (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const tenantResult = await requireTenant(session);
    if (!tenantResult.authorized) return tenantResult.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de categoría requerido' },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: { businessId: tenantResult.tenant, id },
      select: { id: true },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/categories:', error);
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    );
  }
}
