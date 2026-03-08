/**
 * API para gestionar webhooks
 * GET /api/webhooks - Obtiene todos los webhooks  
 * POST /api/webhooks - Crea un webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const webhooks = await prisma.webhook.findMany({
      where: {
        businessId: session.user.businessId!,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(webhooks)
  } catch (error: any) {
    console.error('Error al obtener webhooks:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener webhooks' },
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

    const { name, url, events } = await request.json()

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Nombre, URL y eventos son requeridos' },
        { status: 400 }
      )
    }

    // Validar URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      )
    }

    // Generar secret
    const secret = crypto.randomBytes(32).toString('hex')

    const webhook = await prisma.webhook.create({
      data: {
        businessId: session.user.businessId!,
        name,
        url,
        events,
        secret,
      },
    })

    return NextResponse.json(webhook)
  } catch (error: any) {
    console.error('Error al crear webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear webhook' },
      { status: 500 }
    )
  }
}
