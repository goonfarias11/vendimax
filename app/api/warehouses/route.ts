/**
 * API para gestionar depósitos/almacenes
 * GET /api/warehouses - Obtiene todos los depósitos
 * POST /api/warehouses - Crea un depósito
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const branchId = searchParams.get('branchId')

    const warehouses = await prisma.warehouse.findMany({
      where: {
        branch: {
          businessId: session.user.businessId!,
        },
        ...(activeOnly && { isActive: true }),
        ...(branchId && { branchId }),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            productStocks: true,
            sales: true,
          },
        },
      },
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json(warehouses)
  } catch (error: any) {
    console.error('Error al obtener depósitos:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener depósitos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { branchId, name, code, address, isMain } = await request.json()

    if (!branchId || !name || !code) {
      return NextResponse.json(
        { error: 'Sucursal, nombre y código son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la sucursal pertenece al negocio
    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessId: session.user.businessId!,
      },
    })

    if (!branch) {
      return NextResponse.json(
        { error: 'Sucursal no válida' },
        { status: 400 }
      )
    }

    // Si es el depósito principal de la sucursal, desmarcar los demás
    if (isMain) {
      await prisma.warehouse.updateMany({
        where: {
          branchId,
          isMain: true,
        },
        data: {
          isMain: false,
        },
      })
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        branchId,
        name,
        code,
        address,
        isMain: isMain || false,
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

    return NextResponse.json(warehouse)
  } catch (error: any) {
    console.error('Error al crear depósito:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un depósito con este código en esta sucursal' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear depósito' },
      { status: 500 }
    )
  }
}
