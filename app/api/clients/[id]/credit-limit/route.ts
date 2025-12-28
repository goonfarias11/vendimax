import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { Decimal } from "@prisma/client/runtime/library"

export const runtime = 'nodejs'

// Helper para registrar actividad
async function logActivity(
  clientId: string,
  action: string,
  description: string,
  userId: string,
  metadata?: any,
  ipAddress?: string
) {
  try {
    await prisma.clientActivityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        clientId,
        action,
        description,
        userId,
        metadata,
        ipAddress,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error("Error logging activity:", error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.businessId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar permisos (solo GERENTE, ADMIN, OWNER)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['GERENTE', 'ADMIN', 'OWNER'].includes(user.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar límites de crédito" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { creditLimit } = body;

    // Validar datos
    if (creditLimit === undefined || creditLimit < 0) {
      return NextResponse.json({ error: "Límite de crédito inválido" }, { status: 400 });
    }

    // Verificar que el cliente pertenece al negocio
    const client = await prisma.client.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const previousLimit = client.creditLimit;

    // Actualizar límite y verificar estado
    const updatedClient = await prisma.$transaction(async (tx) => {
      const updated = await tx.client.update({
        where: { id },
        data: {
          creditLimit: new Decimal(creditLimit),
          updatedAt: new Date()
        }
      });

      // Verificar si el estado debe cambiar
      if (updated.currentDebt > updated.creditLimit && updated.status === 'ACTIVE') {
        await tx.client.update({
          where: { id },
          data: { status: 'DELINQUENT' }
        });
      } else if (updated.currentDebt <= updated.creditLimit && updated.status === 'DELINQUENT') {
        await tx.client.update({
          where: { id },
          data: { status: 'ACTIVE' }
        });
      }

      return updated;
    });

    // Registrar actividad
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    await logActivity(
      id,
      'CREDIT_LIMIT_CHANGE',
      `Límite de crédito modificado de $${previousLimit} a $${creditLimit}`,
      session.user.id,
      {
        previousLimit: previousLimit.toString(),
        newLimit: creditLimit.toString(),
        changedBy: session.user.email
      },
      ipAddress
    );

    return NextResponse.json(updatedClient);
  } catch (error) {
    logger.error("Error updating credit limit:", error);
    return NextResponse.json({ error: "Error al actualizar límite de crédito" }, { status: 500 });
  }
}
