/**
 * API para gestionar una sucursal específica
 * PUT /api/branches/[id] - Actualiza una sucursal
 * DELETE /api/branches/[id] - Elimina una sucursal
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { name, address, phone, isActive, isMain } = await request.json()

    // Si se marca como principal, desmarcar las demás
    if (isMain) {
      await prisma.branch.updateMany({
        where: {
          businessId: session.user.businessId!,
          isMain: true,
          id: { not: id },
        },
        data: {
          isMain: false,
        },
      })
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(typeof isMain === 'boolean' && { isMain }),
      },
    })

    return NextResponse.json(branch)
  } catch (error: any) {
    console.error('Error al actualizar sucursal:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar sucursal' },
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
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar si tiene ventas asociadas
    const salesCount = await prisma.sale.count({
      where: { branchId: id },
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una sucursal con ventas asociadas' },
        { status: 400 }
      )
    }

    // Verificar si es la sucursal principal
    const branch = await prisma.branch.findUnique({
      where: { id },
    })

    if (branch?.isMain) {
      return NextResponse.json(
        { error: 'No se puede eliminar la sucursal principal' },
        { status: 400 }
      )
    }

    await prisma.branch.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar sucursal:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar sucursal' },
      { status: 500 }
    )
  }
}
