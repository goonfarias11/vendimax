/**
 * API para exportar ventas a Excel
 * GET /api/export/sales - Exporta ventas en formato Excel
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { excelExportService } from '@/lib/export/excel'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'excel'

    // Construir filtros de fecha
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    // Obtener ventas
    const sales = await prisma.sale.findMany({
      where: {
        businessId: session.user.businessId!,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
        saleItems: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Obtener información del negocio
    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId! },
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    // Generar Excel
    const buffer = await excelExportService.exportSales(sales, business)

    // Nombre del archivo
    const filename = `ventas_${startDate || 'todas'}_${endDate || 'hasta_hoy'}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error al exportar ventas:', error)
    return NextResponse.json(
      { error: error.message || 'Error al exportar ventas' },
      { status: 500 }
    )
  }
}
