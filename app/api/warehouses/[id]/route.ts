/**
 * API para gestionar un depósito específico
 * PUT /api/warehouses/[id] - Actualiza un depósito
 * DELETE /api/warehouses/[id] - Elimina un depósito
 * GET /api/warehouses/[id]/stock - Obtiene el stock del depósito
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { name, address, isActive, isMain } = await request.json()

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
    })

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Depósito no encontrado' },
        { status: 404 }
      )
    }

    // Si se marca como principal, desmarcar los demás de la misma sucursal
    if (isMain) {
      await prisma.warehouse.updateMany({
        where: {
          branchId: warehouse.branchId,
          isMain: true,
          id: { not: params.id },
        },
        data: {
          isMain: false,
        },
      })
    }

    const updatedWarehouse = await prisma.warehouse.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(typeof isMain === 'boolean' && { isMain }),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return NextResponse.json(updatedWarehouse)
  } catch (error: any) {
    console.error('Error al actualizar depósito:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar depósito' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      where: { warehouseId: params.id },
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un depósito con ventas asociadas' },
        { status: 400 }
      )
    }

    // Verificar si tiene stock
    const stockCount = await prisma.productStock.count({
      where: { 
        warehouseId: params.id,
        stock: { gt: 0 },
      },
    })

    if (stockCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un depósito con stock' },
        { status: 400 }
      )
    }

    // Verificar si es el depósito principal
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
    })

    if (warehouse?.isMain) {
      return NextResponse.json(
        { error: 'No se puede eliminar el depósito principal' },
        { status: 400 }
      )
    }

    await prisma.warehouse.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar depósito:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar depósito' },
      { status: 500 }
    )
  }
}
