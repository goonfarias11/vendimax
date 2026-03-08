/**
 * API para gestionar puntos de venta de AFIP
 * GET /api/afip/points-of-sale - Obtiene los puntos de venta
 * POST /api/afip/points-of-sale - Crea un punto de venta
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

    // Obtener configuración de AFIP
    const afipConfig = await prisma.afipConfig.findUnique({
      where: { businessId: session.user.businessId! },
      include: {
        pointsOfSale: {
          orderBy: { number: 'asc' },
        },
      },
    })

    if (!afipConfig) {
      return NextResponse.json([])
    }

    return NextResponse.json(afipConfig.pointsOfSale)
  } catch (error: any) {
    console.error('Error al obtener puntos de venta:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener puntos de venta' },
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

    const { number, name, emissionType } = await request.json()

    if (!number || !name) {
      return NextResponse.json(
        { error: 'Número y nombre son requeridos' },
        { status: 400 }
      )
    }

    // Obtener configuración de AFIP
    const afipConfig = await prisma.afipConfig.findUnique({
      where: { businessId: session.user.businessId! },
    })

    if (!afipConfig) {
      return NextResponse.json(
        { error: 'Configure AFIP primero' },
        { status: 400 }
      )
    }

    // Crear punto de venta
    const pointOfSale = await prisma.pointOfSale.create({
      data: {
        afipConfigId: afipConfig.id,
        number: parseInt(number),
        name,
        emissionType: emissionType || 'CAE',
      },
    })

    return NextResponse.json(pointOfSale)
  } catch (error: any) {
    console.error('Error al crear punto de venta:', error)
    
    // Verificar error de duplicado
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este punto de venta ya existe' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al crear punto de venta' },
      { status: 500 }
    )
  }
}
