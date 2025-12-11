// app/api/admin/precios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los planes y addons
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { position: 'asc' },
      include: {
        priceAdjustments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    const addons = await prisma.addon.findMany({
      include: {
        priceAdjustments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    return NextResponse.json({ plans, addons })

  } catch (error) {
    console.error('Error al obtener precios:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    )
  }
}

// POST - Aplicar ajuste de precios
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, targetId, newMonthlyPrice, newYearlyPrice, reason, ipcValue } = body

    if (type === 'plan') {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: targetId }
      })

      if (!plan) {
        return NextResponse.json(
          { error: 'Plan no encontrado' },
          { status: 404 }
        )
      }

      // Registrar ajuste en historial
      await prisma.priceAdjustment.create({
        data: {
          planId: targetId,
          previousPrice: plan.priceMonthly,
          newPrice: newMonthlyPrice,
          reason,
          ipcValue: ipcValue || null,
          appliedBy: session.user.id,
          notificationSent: false
        }
      })

      // Actualizar precios del plan
      await prisma.subscriptionPlan.update({
        where: { id: targetId },
        data: {
          priceMonthly: newMonthlyPrice,
          priceYearly: newYearlyPrice
        }
      })

      // TODO: Enviar notificaciones a clientes con suscripciones activas
      // (implementar en el sistema de ajuste por IPC)

      return NextResponse.json({
        success: true,
        message: 'Precio actualizado correctamente'
      })
    }

    if (type === 'addon') {
      const addon = await prisma.addon.findUnique({
        where: { id: targetId }
      })

      if (!addon) {
        return NextResponse.json(
          { error: 'Addon no encontrado' },
          { status: 404 }
        )
      }

      // Registrar ajuste
      await prisma.priceAdjustment.create({
        data: {
          addonId: targetId,
          previousPrice: addon.priceMonthly,
          newPrice: newMonthlyPrice,
          reason,
          ipcValue: ipcValue || null,
          appliedBy: session.user.id,
          notificationSent: false
        }
      })

      // Actualizar precio
      await prisma.addon.update({
        where: { id: targetId },
        data: {
          priceMonthly: newMonthlyPrice
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Precio actualizado correctamente'
      })
    }

    return NextResponse.json(
      { error: 'Tipo inválido' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error al actualizar precio:', error)
    return NextResponse.json(
      { error: 'Error al actualizar precio' },
      { status: 500 }
    )
  }
}

// PUT - Activar/desactivar plan o addon
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, targetId, isActive } = body

    if (type === 'plan') {
      await prisma.subscriptionPlan.update({
        where: { id: targetId },
        data: { isActive }
      })
    } else if (type === 'addon') {
      await prisma.addon.update({
        where: { id: targetId },
        data: { isActive }
      })
    } else {
      return NextResponse.json(
        { error: 'Tipo inválido' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${type === 'plan' ? 'Plan' : 'Addon'} ${isActive ? 'activado' : 'desactivado'}`
    })

  } catch (error) {
    console.error('Error al cambiar estado:', error)
    return NextResponse.json(
      { error: 'Error al cambiar estado' },
      { status: 500 }
    )
  }
}
