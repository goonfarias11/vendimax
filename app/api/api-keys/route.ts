/**
 * API para gestionar API Keys
 * GET /api/api-keys - Obtiene todas las API keys
 * POST /api/api-keys - Crea una API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        businessId: session.user.businessId!,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        key: true,
        lastUsedAt: true,
        expiresAt: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Ocultar parte de la key por seguridad
    const maskedKeys = apiKeys.map((key) => ({
      ...key,
      key: `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`,
    }))

    return NextResponse.json(maskedKeys)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener API keys'
    console.error('Error al obtener API keys:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar permisos
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { name, permissions, expiresAt } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Nombre es requerido' },
        { status: 400 }
      )
    }

    // Generar API key única
    const key = `vdm_${crypto.randomBytes(32).toString('hex')}`

    const apiKey = await prisma.apiKey.create({
      data: {
        businessId: session.user.businessId!,
        name,
        key,
        permissions: permissions || [],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json(apiKey)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear API key'
    console.error('Error al crear API key:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
