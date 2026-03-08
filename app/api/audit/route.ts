/**
 * API para obtener logs de auditoría
 * GET /api/audit - Obtiene logs de auditoría
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { auditService } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Solo admin y owner pueden ver auditoría
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity') || undefined
    const userId = searchParams.get('userId') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 100

    const logs = await auditService.getLogs(session.user.businessId!, {
      entity,
      userId,
      startDate,
      endDate,
      limit,
    })

    return NextResponse.json(logs)
  } catch (error: any) {
    console.error('Error al obtener logs de auditoría:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener logs' },
      { status: 500 }
    )
  }
}
