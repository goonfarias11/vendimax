/**
 * API para probar conexión con AFIP
 * GET /api/afip/test - Verifica la conexión y configuración de AFIP
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAfipClient } from '@/lib/afip/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar si el usuario tiene permisos de administrador o owner
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Obtener configuración de AFIP
    const afipConfig = await prisma.afipConfig.findUnique({
      where: { businessId: session.user.businessId! },
      include: {
        pointsOfSale: {
          where: { isActive: true },
        },
      },
    })

    if (!afipConfig) {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay configuración de AFIP',
          message: 'Configure AFIP en Ajustes > Facturación Electrónica',
        },
        { status: 404 }
      )
    }

    // Crear cliente AFIP
    const afipClient = createAfipClient({
      cuit: afipConfig.cuit,
      cert: afipConfig.cert || undefined,
      key: afipConfig.key || undefined,
      certPath: afipConfig.certPath || undefined,
      keyPath: afipConfig.keyPath || undefined,
      production: afipConfig.production,
    })

    // Intentar obtener los tipos de comprobante como test
    try {
      const voucherTypes = await afipClient.getVoucherTypes()

      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa con AFIP',
        config: {
          cuit: afipConfig.cuit,
          razonSocial: afipConfig.razonSocial,
          production: afipConfig.production,
          isActive: afipConfig.isActive,
        },
        pointsOfSale: afipConfig.pointsOfSale,
        voucherTypes: voucherTypes.slice(0, 10), // Solo los primeros 10
      })
    } catch (afipError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al conectar con AFIP',
          message: afipError.message,
          config: {
            cuit: afipConfig.cuit,
            production: afipConfig.production,
          },
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error al probar conexión AFIP:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al probar conexión' 
      },
      { status: 500 }
    )
  }
}
