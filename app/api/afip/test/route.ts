/**
 * API legacy compartida para probar conexión con ARCA
 * GET /api/afip/test (legacy) o /api/arca/test - Verifica la conexión y configuración
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createArcaClient } from '@/lib/arca/client'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar si el usuario tiene permisos de administrador o owner
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener configuración de ARCA (modelo legacy afipConfig)
    const arcaConfig = await prisma.afipConfig.findUnique({
      where: { businessId: session.user.businessId! },
      include: {
        pointsOfSale: {
          where: { isActive: true },
        },
      },
    })

    if (!arcaConfig) {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay configuración de ARCA',
          message: 'Configure ARCA en Ajustes > Facturación Electrónica',
        },
        { status: 404 }
      )
    }

    // Crear cliente ARCA (cliente legacy Afip)
    const arcaClient = createArcaClient({
      cuit: arcaConfig.cuit,
      cert: arcaConfig.cert || undefined,
      key: arcaConfig.key || undefined,
      certPath: arcaConfig.certPath || undefined,
      keyPath: arcaConfig.keyPath || undefined,
      production: arcaConfig.production,
    })

    // Intentar obtener los tipos de comprobante como test
    try {
      const voucherTypes = await arcaClient.getVoucherTypes()

      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa con ARCA',
        config: {
          cuit: arcaConfig.cuit,
          razonSocial: arcaConfig.razonSocial,
          production: arcaConfig.production,
          isActive: arcaConfig.isActive,
        },
        pointsOfSale: arcaConfig.pointsOfSale,
        voucherTypes: voucherTypes.slice(0, 10), // Solo los primeros 10
      })
    } catch (arcaError: unknown) {
      const arcaErrorMessage = arcaError instanceof Error ? arcaError.message : 'Error de conexión desconocido'
      return NextResponse.json(
        {
          success: false,
          error: 'Error al conectar con ARCA',
          message: arcaErrorMessage,
          config: {
            cuit: arcaConfig.cuit,
            production: arcaConfig.production,
          },
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al probar conexión'
    console.error('Error al probar conexión ARCA:', error)
    return NextResponse.json(
      { 
        success: false,
        error: message 
      },
      { status: 500 }
    )
  }
}
