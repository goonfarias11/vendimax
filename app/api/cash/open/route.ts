import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth-middleware'
import { z } from 'zod'

const openCashSchema = z.object({
  openingAmount: z.number().min(0, 'El monto inicial debe ser positivo'),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Verificar permiso
    const permissionCheck = await requirePermission(request, 'cash:register_movement')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    if (!session?.user?.id || !session.user.businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = openCashSchema.parse(body)

    // Verificar que el usuario no tenga una caja abierta
    const existingOpenCash = await prisma.cashRegister.findFirst({
      where: {
        userId: session.user.id,
        businessId: session.user.businessId,
        status: 'OPEN'
      }
    })

    if (existingOpenCash) {
      return NextResponse.json(
        { error: 'Ya tienes una caja abierta. Debes cerrarla antes de abrir una nueva.' },
        { status: 400 }
      )
    }

    // Crear nueva caja
    const cashRegister = await prisma.$transaction(async (tx) => {
      const newCash = await tx.cashRegister.create({
        data: {
          businessId: session.user.businessId!,
          userId: session.user.id,
          openingAmount: validatedData.openingAmount,
          notes: validatedData.notes,
          status: 'OPEN'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Registrar movimiento de apertura
      await tx.cashMovement.create({
        data: {
          type: 'APERTURA',
          amount: validatedData.openingAmount,
          description: `Apertura de caja - ${validatedData.notes || 'Sin observaciones'}`,
          userId: session.user.id,
          businessId: session.user.businessId!,
          cashRegisterId: newCash.id
        }
      })

      return newCash
    })

    return NextResponse.json(cashRegister, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error al abrir caja:', error)
    return NextResponse.json(
      { error: 'Error al abrir caja' },
      { status: 500 }
    )
  }
}
