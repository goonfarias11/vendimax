/**
 * API para el próximo número de comprobante AFIP
 * GET /api/afip/next-voucher - Obtiene el próximo número de comprobante
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

    const { searchParams } = new URL(request.url)
    const pointOfSaleId = searchParams.get('pointOfSaleId')
    const voucherType = parseInt(searchParams.get('voucherType') || '6')

    if (!pointOfSaleId) {
      return NextResponse.json(
        { error: 'pointOfSaleId es requerido' },
        { status: 400 }
      )
    }

    // Obtener configuración de AFIP
    const afipConfig = await prisma.afipConfig.findUnique({
      where: { businessId: session.user.businessId! },
    })

    if (!afipConfig) {
      return NextResponse.json(
        { error: 'Configuración de AFIP no encontrada' },
        { status: 400 }
      )
    }

    // Obtener punto de venta
    const pointOfSale = await prisma.pointOfSale.findUnique({
      where: { id: pointOfSaleId },
    })

    if (!pointOfSale) {
      return NextResponse.json(
        { error: 'Punto de venta no encontrado' },
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

    // Obtener último comprobante
    const lastVoucher = await afipClient.getLastVoucher(
      pointOfSale.number,
      voucherType
    )

    const nextVoucher = lastVoucher + 1

    return NextResponse.json({
      lastVoucher,
      nextVoucher,
      pointOfSale: pointOfSale.number,
      voucherType,
    })
  } catch (error: any) {
    console.error('Error al obtener próximo comprobante:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener próximo comprobante' },
      { status: 500 }
    )
  }
}
