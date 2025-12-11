import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.warn('STRIPE_WEBHOOK_SECRET no está configurado');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Buscar el negocio por customerId
  const business = await prisma.business.findFirst({
    where: {
      subscription: {
        stripeCustomerId: customerId,
      },
    },
  });

  if (!business) {
    console.error('Business not found for customer:', customerId);
    return;
  }

  // Determinar el tipo de plan basado en el price ID
  const priceId = subscription.items.data[0]?.price.id;
  let planType: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE' = 'FREE';

  if (priceId === process.env.STRIPE_PRICE_ID_STARTER) {
    planType = 'STARTER';
  } else if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
    planType = 'PRO';
  } else if (priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE) {
    planType = 'ENTERPRISE';
  }

  // Actualizar suscripción
  await prisma.subscription.upsert({
    where: { businessId: business.id },
    create: {
      businessId: business.id,
      planType,
      status: mapStripeStatus(subscription.status),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      trialEnd: (subscription as any).trial_end
        ? new Date((subscription as any).trial_end * 1000)
        : null,
    },
    update: {
      planType,
      status: mapStripeStatus(subscription.status),
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      trialEnd: (subscription as any).trial_end
        ? new Date((subscription as any).trial_end * 1000)
        : null,
    },
  });

  // Actualizar plan en el negocio
  await prisma.business.update({
    where: { id: business.id },
    data: { planType },
  });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const business = await prisma.business.findFirst({
    where: {
      subscription: {
        stripeCustomerId: customerId,
      },
    },
  });

  if (!business) {
    return;
  }

  // Cambiar a plan FREE
  await prisma.business.update({
    where: { id: business.id },
    data: { planType: 'FREE' },
  });

  await prisma.subscription.update({
    where: { businessId: business.id },
    data: {
      status: 'CANCELED',
      planType: 'FREE',
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const business = await prisma.business.findFirst({
    where: {
      subscription: {
        stripeCustomerId: customerId,
      },
    },
  });

  if (!business) {
    return;
  }

  // Guardar factura
  await prisma.invoice.create({
    data: {
      businessId: business.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'paid',
      stripeInvoiceId: invoice.id,
      invoiceNumber: invoice.number || undefined,
      invoiceUrl: invoice.hosted_invoice_url || undefined,
      paidAt: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : new Date(),
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const business = await prisma.business.findFirst({
    where: {
      subscription: {
        stripeCustomerId: customerId,
      },
    },
  });

  if (!business) {
    return;
  }

  // Actualizar estado de suscripción
  await prisma.subscription.update({
    where: { businessId: business.id },
    data: {
      status: 'PAST_DUE',
    },
  });

  // Registrar factura fallida
  await prisma.invoice.create({
    data: {
      businessId: business.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'unpaid',
      stripeInvoiceId: invoice.id,
      invoiceNumber: invoice.number || undefined,
    },
  });
}

function mapStripeStatus(
  status: Stripe.Subscription.Status
): 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'UNPAID' {
  const statusMap: Record<Stripe.Subscription.Status, any> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    unpaid: 'UNPAID',
    paused: 'CANCELED',
  };

  return statusMap[status] || 'ACTIVE';
}

// Configuración para recibir el body raw
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
