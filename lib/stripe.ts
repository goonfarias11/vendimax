import Stripe from 'stripe';

// Permitir build sin STRIPE_SECRET_KEY (se lanzará error en runtime si se usa)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

// Configuración de planes
export const STRIPE_PLANS = {
  FREE: {
    name: 'Plan Free',
    price: 0,
    priceId: null, // Free no tiene precio en Stripe
    features: {
      maxProducts: 100,
      maxSales: 50,
      maxUsers: 1,
      multiLocation: false,
      advancedReports: false,
      apiAccess: false,
      invoicing: false,
    },
  },
  STARTER: {
    name: 'Plan Starter',
    price: 2900, // $29 en centavos
    priceId: process.env.STRIPE_PRICE_ID_STARTER,
    features: {
      maxProducts: 1000,
      maxSales: 500,
      maxUsers: 3,
      multiLocation: false,
      advancedReports: true,
      apiAccess: false,
      invoicing: true,
    },
  },
  PRO: {
    name: 'Plan Pro',
    price: 7900, // $79 en centavos
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    features: {
      maxProducts: -1, // ilimitado
      maxSales: -1,
      maxUsers: 10,
      multiLocation: true,
      advancedReports: true,
      apiAccess: true,
      invoicing: true,
    },
  },
  ENTERPRISE: {
    name: 'Plan Enterprise',
    price: 19900, // $199 en centavos
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    features: {
      maxProducts: -1,
      maxSales: -1,
      maxUsers: -1,
      multiLocation: true,
      advancedReports: true,
      apiAccess: true,
      invoicing: true,
    },
  },
} as const;

export type PlanType = keyof typeof STRIPE_PLANS;

// Función para crear un customer en Stripe
export async function createStripeCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
) {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  });
}

// Función para crear una suscripción
export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  trialDays: number = 14
) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
  });
}

// Función para cancelar suscripción
export async function cancelStripeSubscription(
  subscriptionId: string,
  immediately: boolean = false
) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: !immediately,
  });
}

// Función para crear un portal de cliente
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Función para crear checkout session
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 14,
    },
  });
}

// Verificar límites del plan
export function checkPlanLimit(
  planType: PlanType,
  limitType: keyof typeof STRIPE_PLANS.FREE.features,
  currentValue: number
): boolean {
  const plan = STRIPE_PLANS[planType];
  const limit = plan.features[limitType];

  if (typeof limit === 'boolean') {
    return limit;
  }

  if (limit === -1) {
    return true; // ilimitado
  }

  return currentValue < limit;
}
