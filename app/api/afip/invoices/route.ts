/**
 * API para generar facturas electrónicas con AFIP
 * POST /api/afip/invoices - Genera una factura para una venta
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createAfipClient } from '@/lib/afip/client'
import { VOUCHER_TYPES, DOCUMENT_TYPES, CONCEPT_TYPES, IVA_TYPES } from '@/lib/afip/types'

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

    // Obtener configuración de AFIP
    const afipConfig = await prisma.afipConfig.findUnique({
      where: { businessId: sale.businessId },
    })

    if (!afipConfig) {
      return NextResponse.json(
        { error: 'Configuración de AFIP no encontrada. Configure AFIP en ajustes.' },
        { status: 400 }
      )
    }

    if (!afipConfig.isActive) {
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

    // Crear cliente AFIP
    const afipClient = createAfipClient({
      cuit: afipConfig.cuit,
      cert: afipConfig.cert || undefined,
      key: afipConfig.key || undefined,
      certPath: afipConfig.certPath || undefined,
      keyPath: afipConfig.keyPath || undefined,
      production: afipConfig.production,
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

    // Generar factura en AFIP
    const afipResponse = await afipClient.createInvoice({
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
    if (afipResponse.result !== 'A') {
      return NextResponse.json(
        {
          error: 'Factura rechazada por AFIP',
          observations: afipResponse.observations,
          errors: afipResponse.errors,
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
        voucherNumber: afipResponse.voucherNumber,
        cae: afipResponse.cae,
        caeDueDate: afipResponse.caeDueDate,
        invoiceDate,
        documentType: finalDocumentType,
        documentNumber: finalDocumentNumber,
        totalAmount,
        netAmount,
        taxAmount,
        exemptAmount,
        result: afipResponse.result,
        observations: afipResponse.observations ? JSON.parse(JSON.stringify(afipResponse.observations)) : undefined,
        errors: afipResponse.errors ? JSON.parse(JSON.stringify(afipResponse.errors)) : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error: any) {
    console.error('Error al generar factura AFIP:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar factura' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/afip/invoices - Obtiene las facturas generadas
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
  } catch (error: any) {
    console.error('Error al obtener facturas:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}
