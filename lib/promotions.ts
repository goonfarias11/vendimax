/**
 * Servicio para evaluar y aplicar promociones
 */

import { prisma } from '@/lib/prisma'

export interface PromotionCondition {
  type: 'product' | 'category' | 'total' | 'quantity' | 'combo'
  productIds?: string[]
  categoryIds?: string[]
  minAmount?: number
  minQuantity?: number
  comboProducts?: Array<{ productId: string; quantity: number }>
}

export interface PromotionDiscount {
  type: 'percentage' | 'fixed' | 'bogo' | 'combo_price'
  value?: number
  freeQuantity?: number
  comboPrice?: number
}

export interface CartItem {
  productId: string
  quantity: number
  price: number
  categoryId?: string
}

export interface AppliedPromotion {
  promotionId: string
  name: string
  type: string
  discount: number
  affectedItems: string[]
}

interface PromotionMeta {
  id: string
  name: string
  type: string
}

export class PromotionService {
  /**
   * Evalúa todas las promociones activas para un carrito
   */
  async evaluatePromotions(
    businessId: string,
    cart: CartItem[]
  ): Promise<AppliedPromotion[]> {
    const now = new Date()

    // Obtener promociones activas
    const promotions = await prisma.promotion.findMany({
      where: {
        businessId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: {
        priority: 'desc', // Mayor prioridad primero
      },
    })

    const appliedPromotions: AppliedPromotion[] = []

    for (const promotion of promotions) {
      // Verificar si alcanzó el límite de usos
      if (promotion.maxUses && promotion.currentUses >= promotion.maxUses) {
        continue
      }

      const conditions = promotion.conditions as unknown as PromotionCondition
      const discount = promotion.discount as unknown as PromotionDiscount

      // Evaluar si se cumple la condición
      if (this.meetsCondition(cart, conditions)) {
        const applied = this.applyDiscount(cart, discount, {
          id: promotion.id,
          name: promotion.name,
          type: promotion.type,
        })
        if (applied) {
          appliedPromotions.push(applied)
        }
      }
    }

    return appliedPromotions
  }

  /**
   * Verifica si el carrito cumple con la condición de la promoción
   */
  private meetsCondition(cart: CartItem[], condition: PromotionCondition): boolean {
    switch (condition.type) {
      case 'product': {
        // Verifica si contiene alguno de los productos especificados
        if (!condition.productIds) return false
        return cart.some((item) => condition.productIds!.includes(item.productId))
      }

      case 'category': {
        // Verifica si contiene productos de las categorías especificadas
        if (!condition.categoryIds) return false
        return cart.some(
          (item) => item.categoryId && condition.categoryIds!.includes(item.categoryId)
        )
      }

      case 'total': {
        // Verifica si el total del carrito supera el mínimo
        if (!condition.minAmount) return false
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        return total >= condition.minAmount
      }

      case 'quantity': {
        // Verifica si la cantidad total supera el mínimo
        if (!condition.minQuantity) return false
        const quantity = cart.reduce((sum, item) => sum + item.quantity, 0)
        return quantity >= condition.minQuantity
      }

      case 'combo': {
        // Verifica si contiene el combo completo
        if (!condition.comboProducts) return false
        return condition.comboProducts.every((comboItem) => {
          const cartItem = cart.find((item) => item.productId === comboItem.productId)
          return cartItem && cartItem.quantity >= comboItem.quantity
        })
      }

      default:
        return false
    }
  }

  /**
   * Aplica el descuento al carrito
   */
  private applyDiscount(
    cart: CartItem[],
    discount: PromotionDiscount,
    promotion: PromotionMeta
  ): AppliedPromotion | null {
    const affectedItems: string[] = []
    let discountAmount = 0

    switch (discount.type) {
      case 'percentage': {
        // Descuento porcentual sobre el total
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        discountAmount = (total * (discount.value || 0)) / 100
        affectedItems.push(...cart.map((item) => item.productId))
        break
      }

      case 'fixed': {
        // Descuento fijo
        discountAmount = discount.value || 0
        affectedItems.push(...cart.map((item) => item.productId))
        break
      }

      case 'bogo': {
        // Buy One Get One (2x1, 3x2, etc.)
        const freeQuantity = discount.freeQuantity || 1
        cart.forEach((item) => {
          const sets = Math.floor(item.quantity / (freeQuantity + 1))
          if (sets > 0) {
            discountAmount += sets * item.price * freeQuantity
            affectedItems.push(item.productId)
          }
        })
        break
      }

      case 'combo_price': {
        // Precio especial para combo
        const comboTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const comboPrice = discount.comboPrice || 0
        discountAmount = Math.max(0, comboTotal - comboPrice)
        affectedItems.push(...cart.map((item) => item.productId))
        break
      }

      default:
        return null
    }

    if (discountAmount > 0) {
      return {
        promotionId: promotion.id,
        name: promotion.name,
        type: promotion.type,
        discount: discountAmount,
        affectedItems,
      }
    }

    return null
  }

  /**
   * Incrementa el contador de usos de una promoción
   */
  async incrementUsage(promotionId: string): Promise<void> {
    await prisma.promotion.update({
      where: { id: promotionId },
      data: {
        currentUses: {
          increment: 1,
        },
      },
    })
  }

  /**
   * Calcula el total con descuentos aplicados
   */
  calculateTotal(subtotal: number, appliedPromotions: AppliedPromotion[]): number {
    const totalDiscount = appliedPromotions.reduce(
      (sum, promo) => sum + promo.discount,
      0
    )
    return Math.max(0, subtotal - totalDiscount)
  }
}

export const promotionService = new PromotionService()
