import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth-middleware'
import { requireTenant } from '@/lib/security/tenant'
import { cashOpenSchema } from '@/lib/validation/cash/cashOpen.schema'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await requirePermission(request, 'cash:register_movement')
    if (!permissionCheck.authorized) return permissionCheck.response

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const body = await request.json()
    const validated = cashOpenSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validated.error.issues },
        { status: 400 }
      )
    }

    const existingOpen = await prisma.cashRegister.findFirst({
      where: { businessId: tenant, status: 'OPEN' }
    })
    if (existingOpen) {
      return NextResponse.json(
        { error: 'Cash register already open' },
        { status: 409 }
      )
    }

    const cashRegister = await prisma.$transaction(async (tx) => {
      const newCash = await tx.cashRegister.create({
        data: {
          businessId: tenant,
          userId: session!.user.id,
          openingAmount: validated.data.openingAmount,
          notes: validated.data.notes,
          status: 'OPEN'
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      await tx.cashMovement.create({
        data: {
          type: 'APERTURA',
          amount: validated.data.openingAmount,
          description: `Apertura de caja - ${validated.data.notes || 'Sin observaciones'}`,
          userId: session!.user.id,
          businessId: tenant,
          cashRegisterId: newCash.id
        }
      })

      return newCash
    })

    return NextResponse.json(cashRegister, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('[API ERROR]', error)
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
  }
}
