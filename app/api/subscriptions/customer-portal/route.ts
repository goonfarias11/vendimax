import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCustomerPortalSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        business: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user?.business?.subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No tienes una suscripción activa' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const portalSession = await createCustomerPortalSession(
      user.business.subscription.stripeCustomerId,
      `${baseUrl}/dashboard/ajustes`
    );

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error('Error en customer-portal:', error);
    return NextResponse.json(
      { error: 'Error al crear portal de cliente' },
      { status: 500 }
    );
  }
}
