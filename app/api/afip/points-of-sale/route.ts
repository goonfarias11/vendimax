/**
 * API legacy compartida para gestionar puntos de venta ARCA
 * GET /api/afip/points-of-sale (legacy) o /api/arca/points-of-sale - Obtiene los puntos de venta
 * POST /api/afip/points-of-sale (legacy) o /api/arca/points-of-sale - Crea un punto de venta
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener configuración de ARCA (modelo legacy afipConfig)
    const arcaConfig = await prisma.afipConfig.findUnique({
      where: { businessId: session.user.businessId! },
      include: {
        pointsOfSale: {
          orderBy: { number: 'asc' },
        },
      },
    })

    if (!arcaConfig) {
      return NextResponse.json([])
    }

    return NextResponse.json(arcaConfig.pointsOfSale)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener puntos de venta'
    console.error('Error al obtener puntos de venta:', error)
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

    // Obtener configuración de ARCA (modelo legacy afipConfig)
    const arcaConfig = await prisma.afipConfig.findUnique({
      where: { businessId: session.user.businessId! },
    })

    if (!arcaConfig) {
      return NextResponse.json(
        { error: 'Configure ARCA primero' },
        { status: 400 }
      )
    }

    // Crear punto de venta
    const pointOfSale = await prisma.pointOfSale.create({
      data: {
        afipConfigId: arcaConfig.id,
        number: parseInt(number),
        name,
        emissionType: emissionType || 'CAE',
      },
    })

    return NextResponse.json(pointOfSale)
  } catch (error) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: string }).code
        : undefined
    const message = error instanceof Error ? error.message : 'Error al crear punto de venta'
    console.error('Error al crear punto de venta:', error)
    
    // Verificar error de duplicado
    if (errorCode === 'P2002') {
      return NextResponse.json(
        { error: 'Este punto de venta ya existe' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
