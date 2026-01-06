import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRefundSchema } from "@/lib/validations/refund";
import { logger } from "@/lib/logger";

// POST /api/sales/[id]/refund - Crear devolución (total o parcial)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: saleId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createRefundSchema.parse(body);

    // Verificar que la venta existe
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        saleItems: {
          include: {
            product: true,
          },
        },
        refunds: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // Validar que la venta no está completamente reembolsada
    if (sale.status === "REEMBOLSADO") {
      return NextResponse.json(
        { error: "Esta venta ya fue completamente reembolsada" },
        { status: 400 }
      );
    }

    // Calcular monto total ya devuelto
    const totalRefunded = sale.refunds.reduce(
      (sum, refund) => sum + Number(refund.refundAmount),
      0
    );

    // Validar que no se exceda el monto de la venta
    if (totalRefunded + validatedData.refundAmount > Number(sale.total)) {
      return NextResponse.json(
        { 
          error: "El monto total de devoluciones excede el total de la venta",
          totalSale: Number(sale.total),
          totalRefunded,
          maxRefundable: Number(sale.total) - totalRefunded
        },
        { status: 400 }
      );
    }

    // Validar cantidades de productos
    for (const item of validatedData.items) {
      const saleItem = sale.saleItems.find((si) => si.id === item.saleItemId);
      
      if (!saleItem) {
        return NextResponse.json(
          { error: `Item de venta ${item.saleItemId} no encontrado` },
          { status: 400 }
        );
      }

      // Calcular cantidad ya devuelta de este item
      const refundedItems = await prisma.refundItem.findMany({
        where: {
          saleItemId: item.saleItemId,
        },
      });

      const quantityRefunded = refundedItems.reduce(
        (sum, ri) => sum + ri.quantity,
        0
      );

      if (quantityRefunded + item.quantity > saleItem.quantity) {
        return NextResponse.json(
          { 
            error: `La cantidad a devolver del producto ${saleItem.product.name} excede la cantidad vendida`,
            sold: saleItem.quantity,
            alreadyRefunded: quantityRefunded,
            maxRefundable: saleItem.quantity - quantityRefunded
          },
          { status: 400 }
        );
      }
    }

    // Crear devolución en transacción
    const refund = await prisma.$transaction(async (tx) => {
      // 1. Crear registro de devolución
      const newRefund = await tx.refund.create({
        data: {
          saleId,
          userId: session.user.id,
          type: validatedData.type,
          reason: validatedData.reason,
          refundAmount: validatedData.refundAmount,
          restockItems: validatedData.restockItems,
          notes: validatedData.notes,
        },
      });

      // 2. Crear items de devolución y actualizar stock si corresponde
      for (const item of validatedData.items) {
        await tx.refundItem.create({
          data: {
            refundId: newRefund.id,
            saleItemId: item.saleItemId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          },
        });

        // 3. Devolver stock si restockItems = true
        if (validatedData.restockItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
            },
          });

          // Registrar movimiento de stock
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "ENTRADA",
              quantity: item.quantity,
              reason: `Devolución ${validatedData.type === "TOTAL" ? "total" : "parcial"} - Venta #${sale.ticketNumber || sale.id.slice(-6)}`,
              reference: newRefund.id,
              userId: session.user.id,
            },
          });
        }
      }

      // 4. Actualizar estado de la venta
      const newTotalRefunded = totalRefunded + validatedData.refundAmount;
      const isFullyRefunded = newTotalRefunded >= Number(sale.total);
      
      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: isFullyRefunded 
            ? "REEMBOLSADO" 
            : "PARCIALMENTE_REEMBOLSADO",
        },
      });

      // 5. Registrar movimiento de caja (salida de dinero)
      if (sale.paymentMethod !== "CUENTA_CORRIENTE") {
        await tx.cashMovement.create({
          data: {
            type: "SALIDA",
            amount: validatedData.refundAmount,
            description: `Devolución ${validatedData.type === "TOTAL" ? "total" : "parcial"} - Venta #${sale.ticketNumber || sale.id.slice(-6)} - ${validatedData.reason}`,
            reference: newRefund.id,
            userId: session.user.id,
            businessId: sale.businessId,
          },
        });
      }

      // 6. Si el cliente tenía deuda (cuenta corriente), ajustar
      if (sale.clientId && sale.paymentMethod === "CUENTA_CORRIENTE") {
        await tx.client.update({
          where: { id: sale.clientId },
          data: {
            currentDebt: { decrement: validatedData.refundAmount },
          },
        });
      }

      return newRefund;
    });

    logger.info("Devolución creada", {
      refundId: refund.id,
      saleId,
      type: validatedData.type,
      amount: validatedData.refundAmount,
      userId: session.user.id,
    });

    // Retornar devolución con todos los detalles
    const refundWithDetails = await prisma.refund.findUnique({
      where: { id: refund.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        sale: {
          select: {
            ticketNumber: true,
            total: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(refundWithDetails, { status: 201 });
  } catch (error: any) {
    logger.error("Error al crear devolución:", error);
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al procesar devolución", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/sales/[id]/refund - Obtener devoluciones de una venta
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: saleId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const refunds = await prisma.refund.findMany({
      where: { saleId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(refunds);
  } catch (error: any) {
    logger.error("Error al obtener devoluciones:", error);
    return NextResponse.json(
      { error: "Error al obtener devoluciones", details: error.message },
      { status: 500 }
    );
  }
}
