/**
 * API para gestionar sucursales
 * GET /api/branches - Obtiene todas las sucursales
 * POST /api/branches - Crea una sucursal
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

    const branches = await prisma.branch.findMany({
      where: {
        businessId: session.user.businessId!,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        warehouses: {
          where: activeOnly ? { isActive: true } : undefined,
        },
        _count: {
          select: {
            warehouses: true,
            sales: true,
          },
        },
      },
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json(branches)
  } catch (error: any) {
    console.error('Error al obtener sucursales:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener sucursales' },
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

    const { name, code, address, phone, isMain } = await request.json()

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Nombre y código son requeridos' },
        { status: 400 }
      )
    }

    // Si es la sucursal principal, desmarcar las demás
    if (isMain) {
      await prisma.branch.updateMany({
        where: {
          businessId: session.user.businessId!,
          isMain: true,
        },
        data: {
          isMain: false,
        },
      })
    }

    const branch = await prisma.branch.create({
      data: {
        businessId: session.user.businessId!,
        name,
        code,
        address,
        phone,
        isMain: isMain || false,
      },
    })

    return NextResponse.json(branch)
  } catch (error: any) {
    console.error('Error al crear sucursal:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una sucursal con este código' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear sucursal' },
      { status: 500 }
    )
  }
}
