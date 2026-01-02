import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/clients/[id]/credit - Gestionar límite de crédito
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { creditLimit, payment } = await req.json();

    // Verificar que el cliente pertenezca al negocio
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        creditLimit: true,
        currentDebt: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Si se envía un pago, registrarlo
    if (payment && payment > 0) {
      // Actualizar deuda del cliente
      const currentDebt = parseFloat(client.currentDebt.toString());
      const newDebt = Math.max(0, currentDebt - payment);
      
      await prisma.client.update({
        where: { id },
        data: { currentDebt: newDebt },
      });

      // Registrar movimiento de caja
      await prisma.cashMovement.create({
        data: {
          userId: session.user.id,
          type: "INGRESO",
          amount: payment,
          description: `Pago cuenta corriente - ${client.name}`,
          reference: `credit-payment-${id}`,
          businessId: session.user.businessId!,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Pago registrado exitosamente",
        previousDebt: parseFloat(client.currentDebt.toString()),
        newDebt,
        payment,
      });
    }

    // Si se actualiza el límite de crédito
    if (creditLimit !== undefined) {
      const updated = await prisma.client.update({
        where: { id },
        data: { creditLimit },
        select: {
          id: true,
          name: true,
          creditLimit: true,
          currentDebt: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Límite de crédito actualizado",
        client: updated,
      });
    }

    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  } catch (error: any) {
    console.error("[PUT /api/clients/[id]/credit]", error);
    return NextResponse.json(
      { error: "Error al gestionar crédito", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/clients/[id]/credit - Obtener estado de cuenta del cliente
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener cliente con sus ventas a crédito
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        sales: {
          where: {
            paymentMethod: "CUENTA_CORRIENTE",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Calcular estadísticas
    const creditLimit = parseFloat(client.creditLimit.toString());
    const currentDebt = parseFloat(client.currentDebt.toString());
    const availableCredit = creditLimit - currentDebt;
    const creditUsagePercentage = creditLimit > 0 
      ? (currentDebt / creditLimit) * 100 
      : 0;

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        creditLimit,
        currentDebt,
        availableCredit: Math.max(0, availableCredit),
        creditUsagePercentage: Math.round(creditUsagePercentage),
      },
      recentSales: client.sales,
      stats: {
        totalCreditSales: client.sales.length,
        totalAmount: client.sales.reduce((sum: number, sale: any) => sum + parseFloat(sale.total.toString()), 0),
      },
    });
  } catch (error: any) {
    console.error("[GET /api/clients/[id]/credit]", error);
    return NextResponse.json(
      { error: "Error al obtener estado de cuenta", details: error.message },
      { status: 500 }
    );
  }
}
