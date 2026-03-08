/**
 * API para exportar reporte de IVA a Excel
 * GET /api/export/iva - Exporta reporte de IVA en formato Excel
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { excelExportService } from '@/lib/export/excel'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Fechas de inicio y fin son requeridas' },
        { status: 400 }
      )
    }

    // Construir filtros de fecha
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Obtener ventas del periodo
    const sales = await prisma.sale.findMany({
      where: {
        businessId: session.user.businessId!,
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETADO',
      },
      include: {
        client: {
          select: {
            name: true,
            taxId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Obtener información del negocio
    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId! },
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    // Formato del periodo
    const period = `${format(start, 'dd/MM/yyyy', { locale: es })} - ${format(end, 'dd/MM/yyyy', { locale: es })}`

    // Generar Excel
    const buffer = await excelExportService.exportIVA(sales, business, period)

    // Nombre del archivo
    const filename = `iva_${format(start, 'yyyy-MM-dd')}_${format(end, 'yyyy-MM-dd')}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error al exportar IVA:', error)
    return NextResponse.json(
      { error: error.message || 'Error al exportar IVA' },
      { status: 500 }
    )
  }
}
