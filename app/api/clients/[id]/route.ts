import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
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
    // Verificar permiso para ver clientes
    const permissionCheck = await requirePermission(request, 'clients:view')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth();
    
    if (!session?.user?.businessId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Calcular métricas
    const salesMetrics = await prisma.sale.aggregate({
      where: { clientId: id },
      _sum: { total: true },
      _count: true
    });

    return NextResponse.json({
      ...client,
      totalPurchased: salesMetrics._sum.total || 0,
      purchaseCount: salesMetrics._count,
      averageTicket: salesMetrics._count > 0 
        ? Number(salesMetrics._sum.total) / salesMetrics._count 
        : 0
    });
  } catch (error) {
    logger.error("Error fetching client:", error);
    return NextResponse.json({ error: "Error al cargar cliente" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar permiso para editar clientes
    const permissionCheck = await requirePermission(request, 'clients:edit')
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.businessId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      taxId,
      notes,
      tags,
      creditLimit,
      hasCreditAccount,
      status,
      isActive
    } = body;

    // Verificar que el cliente pertenece al negocio
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        taxId: true,
        notes: true,
        tags: true,
        creditLimit: true,
        hasCreditAccount: true,
        status: true,
        isActive: true
      }
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Registrar cambios para auditoría
    const changes: any = {};
    if (name !== existingClient.name) changes.name = { from: existingClient.name, to: name };
    if (email !== existingClient.email) changes.email = { from: existingClient.email, to: email };
    if (phone !== existingClient.phone) changes.phone = { from: existingClient.phone, to: phone };
    if (creditLimit !== undefined && Number(creditLimit) !== Number(existingClient.creditLimit)) {
      changes.creditLimit = { from: existingClient.creditLimit.toString(), to: creditLimit.toString() };
    }
    if (hasCreditAccount !== undefined && hasCreditAccount !== existingClient.hasCreditAccount) {
      changes.hasCreditAccount = { from: existingClient.hasCreditAccount, to: hasCreditAccount };
    }
    if (status && status !== existingClient.status) {
      changes.status = { from: existingClient.status, to: status };
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (taxId !== undefined) updateData.taxId = taxId || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (tags !== undefined) updateData.tags = tags;
    if (creditLimit !== undefined) updateData.creditLimit = creditLimit;
    if (hasCreditAccount !== undefined) updateData.hasCreditAccount = hasCreditAccount;
    if (status !== undefined) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData
    });

    // Registrar actividad
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    await logActivity(
      id,
      'UPDATE',
      `Cliente actualizado por ${session.user.email}`,
      session.user.id,
      changes,
      ipAddress
    );

    return NextResponse.json(updatedClient);
  } catch (error) {
    logger.error("Error updating client:", error);
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.businessId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el cliente pertenece al negocio
    const client = await prisma.client.findFirst({
      where: {
        id,
        businessId: session.user.businessId
      },
      include: {
        _count: {
          select: { sales: true }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // No permitir eliminar clientes con ventas
    if (client._count.sales > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un cliente con ventas registradas" },
        { status: 400 }
      );
    }

    await prisma.client.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Cliente eliminado" });
  } catch (error) {
    logger.error("Error deleting client:", error);
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 });
  }
}
