/**
 * API para gestionar una promoción específica
 * GET /api/promotions/[id] - Obtiene una promoción
 * PUT /api/promotions/[id] - Actualiza una promoción
 * DELETE /api/promotions/[id] - Elimina una promoción
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const promotion = await prisma.promotion.findFirst({
      where: {
        id,
        businessId: session.user.businessId!,
      },
    })

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promoción no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(promotion)
  } catch (error: any) {
    console.error('Error al obtener promoción:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener promoción' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    if (
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'OWNER' &&
      session.user.role !== 'GERENTE'
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const {
      name,
      description,
      isActive,
      startDate,
      endDate,
      conditions,
      discount,
      priority,
      maxUses,
    } = await request.json()

    // Validar fechas si se proporcionan ambas
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (end <= start) {
        return NextResponse.json(
          { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
          { status: 400 }
        )
      }
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(conditions && { conditions }),
        ...(discount && { discount }),
        ...(typeof priority === 'number' && { priority }),
        ...(typeof maxUses === 'number' && { maxUses }),
      },
    })

    return NextResponse.json(promotion)
  } catch (error: any) {
    console.error('Error al actualizar promoción:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar promoción' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    if (
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'OWNER' &&
      session.user.role !== 'GERENTE'
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await prisma.promotion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar promoción:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar promoción' },
      { status: 500 }
    )
  }
}
