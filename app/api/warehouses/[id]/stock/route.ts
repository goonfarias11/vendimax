/**
 * API para gestion stock de un depósito
 * GET /api/warehouses/[id]/stock - Stock del depósito
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lowStock = searchParams.get('lowStock') === 'true'

    const stocks = await prisma.productStock.findMany({
      where: {
        warehouseId: params.id,
        ...(lowStock && {
          product: {
            minStock: { gt: 0 },
          },
          stock: {
            lte: prisma.productStock.fields.stock, // stock <= minStock
          },
        }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            image: true,
            minStock: true,
            price: true,
            cost: true,
            unit: true,
          },
        },
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    })

    return NextResponse.json(stocks)
  } catch (error: any) {
    console.error('Error al obtener stock del depósito:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener stock' },
      { status: 500 }
    )
  }
}
