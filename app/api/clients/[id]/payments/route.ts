import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { Decimal } from "@prisma/client/runtime/library"
import { requirePermission } from "@/lib/auth-middleware"

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

    const payments = await prisma.clientPayment.findMany({
      where: { clientId: id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(payments);
  } catch (error) {
    logger.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Error al cargar pagos" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar permiso para registrar pagos
    const permissionCheck = await requirePermission(request, 'clients:register_payment')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth();
    
    if (!session?.user?.businessId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentMethod, reference, notes } = body;

    // Validar datos
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "Método de pago requerido" }, { status: 400 });
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

    // Crear pago y actualizar deuda en una transacción
    const [payment, updatedClient] = await prisma.$transaction(async (tx) => {
      // Crear pago
      const newPayment = await tx.clientPayment.create({
        data: {
          id: `payment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          clientId: id,
          amount: new Decimal(amount),
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
          userId: session.user.id!,
          createdAt: new Date()
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      // Actualizar deuda del cliente
      const newDebt = Number(client.currentDebt) - Number(amount);
      const updatedClient = await tx.client.update({
        where: { id },
        data: {
          currentDebt: Math.max(0, newDebt), // No permitir deuda negativa
          updatedAt: new Date()
        }
      });

      // Verificar si el estado debe cambiar
      if (updatedClient.status === 'DELINQUENT' && updatedClient.currentDebt <= updatedClient.creditLimit) {
        await tx.client.update({
          where: { id },
          data: { status: 'ACTIVE' }
        });
      }

      return [newPayment, updatedClient];
    });

    // Registrar actividad
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    await logActivity(
      id,
      'PAYMENT',
      `Pago registrado: $${amount} vía ${paymentMethod}`,
      session.user.id,
      {
        amount,
        paymentMethod,
        reference,
        previousDebt: client.currentDebt.toString(),
        newDebt: updatedClient.currentDebt.toString()
      },
      ipAddress
    );

    return NextResponse.json({
      payment,
      client: updatedClient
    });
  } catch (error) {
    logger.error("Error creating payment:", error);
    return NextResponse.json({ error: "Error al registrar pago" }, { status: 500 });
  }
}
