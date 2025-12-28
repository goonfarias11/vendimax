import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      clientId: id
    };

    if (action) {
      where.action = action;
    }

    const activityLogs = await prisma.clientActivityLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json(activityLogs);
  } catch (error) {
    logger.error("Error fetching activity logs:", error);
    return NextResponse.json({ error: "Error al cargar actividades" }, { status: 500 });
  }
}
