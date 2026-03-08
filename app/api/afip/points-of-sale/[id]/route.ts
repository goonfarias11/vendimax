/**
 * API para gestionar un punto de venta específico
 * PUT /api/afip/points-of-sale/[id] - Actualiza un punto de venta
 * DELETE /api/afip/points-of-sale/[id] - Elimina un punto de venta
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

    const { name, isActive, emissionType } = await request.json()

    const pointOfSale = await prisma.pointOfSale.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(emissionType && { emissionType }),
      },
    })

    return NextResponse.json(pointOfSale)
  } catch (error: any) {
    console.error('Error al actualizar punto de venta:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar punto de venta' },
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

    // Verificar si tiene facturas asociadas
    const invoiceCount = await prisma.afipInvoice.count({
      where: { pointOfSaleId: params.id },
    })

    if (invoiceCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un punto de venta con facturas asociadas' },
        { status: 400 }
      )
    }

    await prisma.pointOfSale.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al eliminar punto de venta:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar punto de venta' },
      { status: 500 }
    )
  }
}
