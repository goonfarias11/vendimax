/**
 * API legacy compartida para generar facturas electrónicas con ARCA
 * POST /api/afip/invoices (legacy) o /api/arca/invoices - Genera una factura para una venta
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createArcaClient } from '@/lib/arca/client'
import { VOUCHER_TYPES, DOCUMENT_TYPES, CONCEPT_TYPES, IVA_TYPES } from '@/lib/arca/types'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { saleId, pointOfSaleId, voucherType, documentType, documentNumber } = await request.json()

    if (!saleId || !pointOfSaleId) {
      return NextResponse.json(
        { error: 'saleId y pointOfSaleId son requeridos' },
        { status: 400 }
      )
    }

    // Obtener la venta con todos los datos necesarios
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        saleItems: {
          include: {
            product: true,
          },
        },
        client: true,
        business: true,
      },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Verificar que la venta pertenece al negocio del usuario
    if (sale.businessId !== session.user.businessId!) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Verificar si ya existe una factura para esta venta
    const existingInvoice = await prisma.afipInvoice.findUnique({
      where: { saleId },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Esta venta ya tiene una factura generada' },
        { status: 400 }
      )
    }

    // Obtener configuración de ARCA (modelo legacy afipConfig)
    const arcaConfig = await prisma.afipConfig.findUnique({
      where: { businessId: sale.businessId },
    })

    if (!arcaConfig) {
      return NextResponse.json(
        { error: 'Configuración de ARCA no encontrada. Configure ARCA en ajustes.' },
        { status: 400 }
      )
    }

    if (!arcaConfig.isActive) {
      return NextResponse.json(
        { error: 'La facturación electrónica está desactivada' },
        { status: 400 }
      )
    }

    // Obtener punto de venta
    const pointOfSale = await prisma.pointOfSale.findUnique({
      where: { id: pointOfSaleId },
    })

    if (!pointOfSale || !pointOfSale.isActive) {
      return NextResponse.json(
        { error: 'Punto de venta no válido' },
        { status: 400 }
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

    // Calcular montos
    const totalAmount = Number(sale.total)
    const netAmount = Number(sale.subtotal)
    const taxAmount = Number(sale.tax)
    const exemptAmount = 0

    // Determinar tipo de documento y número
    const finalDocumentType = documentType || DOCUMENT_TYPES.SIN_IDENTIFICAR
    const finalDocumentNumber = documentNumber || '0'

    // Determinar tipo de comprobante (por defecto Factura B)
    const finalVoucherType = voucherType || VOUCHER_TYPES.FACTURA_B

    // Preparar impuestos (IVA)
    const taxes = taxAmount > 0
      ? [
          {
            id: IVA_TYPES.IVA_21,
            description: 'IVA 21%',
            baseAmount: netAmount,
            amount: taxAmount,
          },
        ]
      : []

    // Formato de fecha YYYYMMDD
    const invoiceDate = new Date().toISOString().split('T')[0].replace(/-/g, '')

    // Generar factura en ARCA
    const arcaResponse = await arcaClient.createInvoice({
      pointOfSale: pointOfSale.number,
      voucherType: finalVoucherType,
      concept: CONCEPT_TYPES.PRODUCTOS,
      documentType: finalDocumentType,
      documentNumber: parseInt(finalDocumentNumber),
      invoiceDate,
      totalAmount,
      netAmount,
      exemptAmount,
      taxes,
    })

    // Verificar resultado
    if (arcaResponse.result !== 'A') {
      return NextResponse.json(
        {
          error: 'Factura rechazada por ARCA',
          observations: arcaResponse.observations,
          errors: arcaResponse.errors,
        },
        { status: 400 }
      )
    }

    // Guardar factura en la base de datos
    const invoice = await prisma.afipInvoice.create({
      data: {
        saleId,
        pointOfSaleId,
        voucherType: finalVoucherType,
        voucherNumber: arcaResponse.voucherNumber,
        cae: arcaResponse.cae,
        caeDueDate: arcaResponse.caeDueDate,
        invoiceDate,
        documentType: finalDocumentType,
        documentNumber: finalDocumentNumber,
        totalAmount,
        netAmount,
        taxAmount,
        exemptAmount,
        result: arcaResponse.result,
        observations: arcaResponse.observations ? JSON.parse(JSON.stringify(arcaResponse.observations)) : undefined,
        errors: arcaResponse.errors ? JSON.parse(JSON.stringify(arcaResponse.errors)) : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al generar factura'
    console.error('Error al generar factura ARCA:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/afip/invoices (legacy) o /api/arca/invoices - Obtiene las facturas generadas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const saleId = searchParams.get('saleId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Si se especifica una venta, devolver solo esa factura
    if (saleId) {
      const invoice = await prisma.afipInvoice.findUnique({
        where: { saleId },
        include: {
          pointOfSale: true,
        },
      })

      return NextResponse.json(invoice)
    }

    // Obtener todas las facturas del negocio
    const invoices = await prisma.afipInvoice.findMany({
      where: {
        pointOfSale: {
          afipConfig: {
            businessId: session.user.businessId!,
          },
        },
      },
      include: {
        pointOfSale: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json(invoices)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener facturas'
    console.error('Error al obtener facturas:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
