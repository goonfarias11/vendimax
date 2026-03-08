/**
 * Middleware para autenticación con API Key
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; businessId?: string; error?: string }> {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return { valid: false, error: 'API Key no proporcionada' }
  }

  try {
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
    })

    if (!key) {
      return { valid: false, error: 'API Key inválida' }
    }

    if (!key.isActive) {
      return { valid: false, error: 'API Key desactivada' }
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      return { valid: false, error: 'API Key expirada' }
    }

    // Actualizar última vez usada
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    })

    return { valid: true, businessId: key.businessId }
  } catch (error) {
    console.error('Error validando API Key:', error)
    return { valid: false, error: 'Error al validar API Key' }
  }
}

export function hasPermission(permissions: string[], requiredPermission: string): boolean {
  if (!permissions || permissions.length === 0) {
    return true // Sin restricciones
  }

  return permissions.includes(requiredPermission) || permissions.includes('*')
}
