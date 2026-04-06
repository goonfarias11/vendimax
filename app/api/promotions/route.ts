/**
 * API para gestionar promociones
 * GET /api/promotions - Obtiene todas las promociones
 * POST /api/promotions - Crea una promoción
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
    const type = searchParams.get('type')

    const now = new Date()

    const promotions = await prisma.promotion.findMany({
      where: {
        businessId: session.user.businessId!,
        ...(activeOnly && {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        }),
        ...(type && { type }),
      },
      orderBy: [
        { priority: 'desc' },
        { endDate: 'desc' },
      ],
    })

    return NextResponse.json(promotions)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener promociones'
    console.error('Error al obtener promociones:', error)
    return NextResponse.json(
      { error: message },
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
      type,
      startDate,
      endDate,
      conditions,
      discount,
      priority,
      maxUses,
    } = await request.json()

    if (!name || !type || !startDate || !endDate || !conditions || !discount) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar fechas
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end <= start) {
      return NextResponse.json(
        { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
        { status: 400 }
      )
    }

    const promotion = await prisma.promotion.create({
      data: {
        businessId: session.user.businessId!,
        name,
        description,
        type,
        startDate: start,
        endDate: end,
        conditions,
        discount,
        priority: priority || 0,
        maxUses,
      },
    })

    return NextResponse.json(promotion)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear promoción'
    console.error('Error al crear promoción:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
