/**
 * API legacy compartida para el próximo número de comprobante ARCA
 * GET /api/afip/next-voucher (legacy) o /api/arca/next-voucher - Obtiene el próximo número de comprobante
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createArcaClient } from '@/lib/arca/client'

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

    // Obtener configuración de ARCA (modelo legacy afipConfig)
    const arcaConfig = await prisma.afipConfig.findUnique({
      where: { businessId: session.user.businessId! },
    })

    if (!arcaConfig) {
      return NextResponse.json(
        { error: 'Configuración de ARCA no encontrada' },
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

    // Crear cliente ARCA (cliente legacy Afip)
    const arcaClient = createArcaClient({
      cuit: arcaConfig.cuit,
      cert: arcaConfig.cert || undefined,
      key: arcaConfig.key || undefined,
      certPath: arcaConfig.certPath || undefined,
      keyPath: arcaConfig.keyPath || undefined,
      production: arcaConfig.production,
    })

    // Obtener último comprobante
    const lastVoucher = await arcaClient.getLastVoucher(
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener próximo comprobante'
    console.error('Error al obtener próximo comprobante:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
