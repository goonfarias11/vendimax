/**
 * API: Exportar cierre de caja a PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que pertenezca al negocio
    const closing = await prisma.cashClosing.findFirst({
      where: {
        id,
        businessId: session.user.businessId,
      },
    })

    if (!closing) {
      return NextResponse.json({ error: 'Cierre no encontrado' }, { status: 404 })
    }

    // TODO: Implementar exportación de cierre de caja a PDF
    // const buffer = await exportCashClosingPDF(params.id)
    return NextResponse.json(
      { error: 'Exportación de cierre PDF pendiente de implementación' },
      { status: 501 }
    )

    /* Cuando se implemente:
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cierre_${closing.number}.pdf"`,
      },
    })
    */
  } catch (error: any) {
    console.error('Error exportando cierre:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
