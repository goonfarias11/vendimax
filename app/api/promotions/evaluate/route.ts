/**
 * API para evaluar promociones en un carrito
 * POST /api/promotions/evaluate - Evalúa promociones activas para un carrito
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { promotionService, type CartItem } from '@/lib/promotions'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { cart } = await request.json()

    if (!cart || !Array.isArray(cart)) {
      return NextResponse.json(
        { error: 'Carrito inválido' },
        { status: 400 }
      )
    }

    // Evaluar promociones
    const appliedPromotions = await promotionService.evaluatePromotions(
      session.user.businessId!,
      cart as CartItem[]
    )

    // Calcular subtotal
    const subtotal = (cart as CartItem[]).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    // Calcular total con descuentos
    const total = promotionService.calculateTotal(subtotal, appliedPromotions)

    const totalDiscount = appliedPromotions.reduce(
      (sum, promo) => sum + promo.discount,
      0
    )

    return NextResponse.json({
      subtotal,
      totalDiscount,
      total,
      appliedPromotions,
    })
  } catch (error: any) {
    console.error('Error al evaluar promociones:', error)
    return NextResponse.json(
      { error: error.message || 'Error al evaluar promociones' },
      { status: 500 }
    )
  }
}
