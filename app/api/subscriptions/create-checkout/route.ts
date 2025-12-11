import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession } from '@/lib/stripe';
import { z } from 'zod';

const createCheckoutSchema = z.object({
  planType: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planType, successUrl, cancelUrl } = createCheckoutSchema.parse(body);

    // Buscar el negocio del usuario
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

    if (!user?.business) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    // Si no tiene customerId de Stripe, crear uno
    let stripeCustomerId = user.business.subscription?.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const { createStripeCustomer } = await import('@/lib/stripe');
      const customer = await createStripeCustomer(
        user.business.email,
        user.business.name,
        {
          businessId: user.business.id,
        }
      );
      stripeCustomerId = customer.id;

      // Guardar customerId
      await prisma.subscription.upsert({
        where: { businessId: user.business.id },
        create: {
          businessId: user.business.id,
          planType: 'FREE',
          status: 'ACTIVE',
          stripeCustomerId: customer.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        },
        update: {
          stripeCustomerId: customer.id,
        },
      });
    }

    // Obtener el priceId del plan
    const { STRIPE_PLANS } = await import('@/lib/stripe');
    const priceId = STRIPE_PLANS[planType].priceId;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Plan no disponible' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Crear sesión de checkout
    const checkoutSession = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      successUrl || `${baseUrl}/dashboard/ajustes?success=true`,
      cancelUrl || `${baseUrl}/precios?canceled=true`
    );

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Error en create-checkout:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear sesión de checkout' },
      { status: 500 }
    );
  }
}
