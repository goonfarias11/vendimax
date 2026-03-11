/**
 * Middleware para API Keys
 * Autenticación para API pública
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../prisma'
import crypto from 'crypto'

/**
 * Valida API Key
 */
export async function validateApiKey(req: NextRequest): Promise<{
  valid: boolean
  businessId?: string
  apiKeyId?: string
  error?: string
}> {
  const apiKey = req.headers.get('x-api-key')

  if (!apiKey) {
    return { valid: false, error: 'API key no proporcionada' }
  }

  // Buscar API key
  const keyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey },
  })

  if (!keyRecord) {
    return { valid: false, error: 'API key inválida' }
  }

  if (!keyRecord.isActive) {
    return { valid: false, error: 'API key desactivada' }
  }

  // Actualizar última vez usada
  await prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    valid: true,
    businessId: keyRecord.businessId,
    apiKeyId: keyRecord.id,
  }
}

/**
 * Registra request de API
 */
export async function logApiRequest(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  // Modelo ApiRequest no existe en el schema actual.
  console.debug('API request', {
    apiKeyId,
    endpoint,
    method,
    statusCode,
    responseTime,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  })
}

/**
 * Genera nueva API Key
 */
export function generateApiKey(): string {
  return `vx_${crypto.randomBytes(32).toString('hex')}`
}

/**
 * Middleware wrapper para rutas de API pública
 */
export function withApiKey(
  handler: (
    req: NextRequest,
    context: { businessId: string; apiKeyId: string }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()

    const validation = await validateApiKey(req)

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 401 })
    }

    const response = await handler(req, {
      businessId: validation.businessId!,
      apiKeyId: validation.apiKeyId!,
    })

    const responseTime = Date.now() - startTime

    // Log request
    await logApiRequest(
      validation.apiKeyId!,
      new URL(req.url).pathname,
      req.method,
      response.status,
      responseTime,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    )

    return response
  }
}
