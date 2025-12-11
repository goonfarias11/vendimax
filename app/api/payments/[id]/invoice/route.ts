// app/api/payments/[id]/invoice/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInvoicePDF } from '@/lib/invoice'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    // Verificar que el pago pertenece al usuario o que es admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true }
    })

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            business: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Verificar permisos
    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = user?.businessId === payment.subscription.businessId

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Verificar que el pago esté aprobado
    if (payment.status !== 'approved') {
      return NextResponse.json(
        { error: 'El pago debe estar aprobado para generar la factura' },
        { status: 400 }
      )
    }

    // Generar PDF
    const pdfBuffer = await generateInvoicePDF(id)

    // Devolver PDF
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${payment.invoiceNumber || id}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generando factura:', error)
    return NextResponse.json(
      { error: 'Error al generar factura' },
      { status: 500 }
    )
  }
}
