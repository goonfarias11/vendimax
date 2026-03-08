/**
 * API para exportar productos a Excel
 * GET /api/export/products - Exporta productos en formato Excel
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
    const categoryId = searchParams.get('categoryId')
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const lowStock = searchParams.get('lowStock') === 'true'

    // Obtener productos
    const products = await prisma.product.findMany({
      where: {
        businessId: session.user.businessId!,
        ...(categoryId && { categoryId }),
        ...(activeOnly && { isActive: true }),
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        ...(lowStock && {
          productStocks: {
            select: {
              stock: true,
            },
          },
        }),
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Filtrar por stock bajo si se solicita (comparar suma de stock con minStock)
    const filteredProducts = lowStock
      ? products.filter(p => {
          const totalStock = p.productStocks?.reduce((sum, ps) => sum + ps.stock, 0) || 0
          return totalStock <= p.minStock || totalStock === 0
        })
      : products

    // Obtener información del negocio
    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId! },
    })

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    // Generar Excel
    const buffer = await excelExportService.exportProducts(filteredProducts, business)

    // Nombre del archivo
    const filename = `productos_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error al exportar productos:', error)
    return NextResponse.json(
      { error: error.message || 'Error al exportar productos' },
      { status: 500 }
    )
  }
}
