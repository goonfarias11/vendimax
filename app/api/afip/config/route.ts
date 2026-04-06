/**
 * API legacy compartida para configuración ARCA
 * GET /api/afip/config (legacy) o /api/arca/config - Obtiene la configuración
 * POST /api/afip/config (legacy) o /api/arca/config - Crea o actualiza la configuración
 * PUT /api/afip/config (legacy) o /api/arca/config - Actualiza la configuración
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

    const config = await prisma.afipConfig.findUnique({
      where: { businessId: session.user.businessId! },
      include: {
        pointsOfSale: {
          orderBy: { number: 'asc' },
        },
      },
    })

    // No devolver las claves privadas por seguridad
    if (config) {
      return NextResponse.json({
        ...config,
        cert: config.cert ? '***CONFIGURADO***' : null,
        key: config.key ? '***CONFIGURADO***' : null,
      })
    }

    return NextResponse.json(null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener configuración'
    console.error('Error al obtener configuración ARCA:', error)
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

    const { cuit, razonSocial, cert, key, certPath, keyPath, production } =
      await request.json()

    if (!cuit || !razonSocial) {
      return NextResponse.json(
        { error: 'CUIT y Razón Social son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si ya existe configuración
    const existingConfig = await prisma.afipConfig.findUnique({
      where: { businessId: session.user.businessId! },
    })

    let config

    if (existingConfig) {
      // Actualizar configuración existente
      config = await prisma.afipConfig.update({
        where: { businessId: session.user.businessId! },
        data: {
          cuit,
          razonSocial,
          ...(cert && { cert }),
          ...(key && { key }),
          ...(certPath && { certPath }),
          ...(keyPath && { keyPath }),
          production: production || false,
        },
      })
    } else {
      // Crear nueva configuración
      config = await prisma.afipConfig.create({
        data: {
          businessId: session.user.businessId!,
          cuit,
          razonSocial,
          cert,
          key,
          certPath,
          keyPath,
          production: production || false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        cert: config.cert ? '***CONFIGURADO***' : null,
        key: config.key ? '***CONFIGURADO***' : null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al guardar configuración'
    console.error('Error al crear/actualizar configuración ARCA:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  return POST(request)
}

export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await prisma.afipConfig.delete({
      where: { businessId: session.user.businessId! },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar configuración'
    console.error('Error al eliminar configuración ARCA:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
