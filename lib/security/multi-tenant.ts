/**
 * Multi-tenancy helper functions
 * Centraliza la lógica para obtener y validar el businessId de la sesión
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Obtiene el businessId de la sesión actual
 * @returns businessId o null si no hay sesión o no tiene negocio asociado
 */
export async function getBusinessIdFromSession(): Promise<string | null> {
  const session = await auth()
  return session?.user?.businessId || null
}

/**
 * Obtiene el businessId de la sesión y lanza error si no existe
 * Usar cuando se requiere businessId obligatoriamente
 * @throws Error si no hay businessId en sesión
 * @returns businessId
 */
export async function requireBusinessId(): Promise<string> {
  const businessId = await getBusinessIdFromSession()
  
  if (!businessId) {
    throw new Error("No business ID found in session. User must be associated with a business.")
  }
  
  return businessId
}

/**
 * Verifica que un recurso pertenezca al negocio actual
 * @param resourceBusinessId - El businessId del recurso a verificar
 * @param currentBusinessId - El businessId de la sesión actual (opcional, se obtiene de la sesión si no se pasa)
 * @returns true si pertenece, false si no
 */
export async function verifyBusinessOwnership(
  resourceBusinessId: string,
  currentBusinessId?: string
): Promise<boolean> {
  const businessId = currentBusinessId || await requireBusinessId()
  return resourceBusinessId === businessId
}

/**
 * Objeto helper para queries de Prisma con scope de business
 * Simplifica agregar el filtro businessId a las queries
 * 
 * @example
 * const products = await prisma.product.findMany(
 *   businessScope(businessId, { isActive: true })
 * )
 */
export function businessScope<T extends Record<string, any>>(
  businessId: string,
  additionalWhere?: T
) {
  return {
    where: {
      businessId,
      ...additionalWhere
    }
  }
}

/**
 * Verifica que un producto pertenezca al negocio actual
 * Lanza error 403 si no pertenece
 * @param productId - ID del producto a verificar
 * @param businessId - businessId del negocio actual (opcional, se obtiene de sesión)
 * @throws Error con status 403 si el producto no pertenece al negocio
 */
export async function verifyProductOwnership(
  productId: string,
  businessId?: string
): Promise<void> {
  const currentBusinessId = businessId || await requireBusinessId()
  
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { businessId: true }
  })
  
  if (!product) {
    throw new Error("Product not found")
  }
  
  if (product.businessId !== currentBusinessId) {
    const error = new Error("Unauthorized access to product") as Error & { status?: number }
    error.status = 403
    throw error
  }
}

/**
 * Verifica que una variante pertenezca al negocio actual
 * @param variantId - ID de la variante a verificar
 * @param businessId - businessId del negocio actual (opcional, se obtiene de sesión)
 * @throws Error con status 403 si la variante no pertenece al negocio
 */
export async function verifyVariantOwnership(
  variantId: string,
  businessId?: string
): Promise<void> {
  const currentBusinessId = businessId || await requireBusinessId()
  
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        select: { businessId: true }
      }
    }
  })
  
  if (!variant) {
    throw new Error("Variant not found")
  }
  
  if (variant.product.businessId !== currentBusinessId) {
    const error = new Error("Unauthorized access to variant") as Error & { status?: number }
    error.status = 403
    throw error
  }
}
