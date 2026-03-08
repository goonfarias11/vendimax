/**
 * API para gestionar configuración de AFIP
 * GET /api/afip/config - Obtiene la configuración
 * POST /api/afip/config - Crea o actualiza la configuración
 * PUT /api/afip/config - Actualiza la configuración
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
  } catch (error: any) {
    console.error('Error al obtener configuración AFIP:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener configuración' },
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
  } catch (error: any) {
    console.error('Error al crear/actualizar configuración AFIP:', error)
    return NextResponse.json(
      { error: error.message || 'Error al guardar configuración' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  return POST(request)
}

export async function DELETE(request: NextRequest) {
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
  } catch (error: any) {
    console.error('Error al eliminar configuración AFIP:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar configuración' },
      { status: 500 }
    )
  }
}
