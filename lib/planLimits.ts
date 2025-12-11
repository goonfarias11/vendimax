import { prisma } from './prisma';
import { STRIPE_PLANS, type PlanType } from './stripe';

export class PlanLimitsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanLimitsError';
  }
}

// Verificar límite de productos
export async function checkProductLimit(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      subscription: true,
    },
  });

  if (!business) {
    throw new Error('Negocio no encontrado');
  }

  const planType = business.planType as PlanType;
  const maxProducts = STRIPE_PLANS[planType].features.maxProducts;

  if (maxProducts === -1) {
    return; // ilimitado
  }

  const productCount = await prisma.product.count({
    where: { isActive: true },
  });

  if (productCount >= maxProducts) {
    throw new PlanLimitsError(
      `Has alcanzado el límite de ${maxProducts} productos para el ${STRIPE_PLANS[planType].name}. Actualiza tu plan para agregar más productos.`
    );
  }
}

// Verificar límite de ventas
export async function checkSalesLimit(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      subscription: true,
    },
  });

  if (!business) {
    throw new Error('Negocio no encontrado');
  }

  const planType = business.planType as PlanType;
  const maxSales = STRIPE_PLANS[planType].features.maxSales;

  if (maxSales === -1) {
    return; // ilimitado
  }

  // Contar ventas del mes actual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const salesCount = await prisma.sale.count({
    where: {
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  if (salesCount >= maxSales) {
    throw new PlanLimitsError(
      `Has alcanzado el límite de ${maxSales} ventas mensuales para el ${STRIPE_PLANS[planType].name}. Actualiza tu plan para procesar más ventas.`
    );
  }
}

// Verificar límite de usuarios
export async function checkUserLimit(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      subscription: true,
      users: {
        where: { isActive: true },
      },
    },
  });

  if (!business) {
    throw new Error('Negocio no encontrado');
  }

  const planType = business.planType as PlanType;
  const maxUsers = STRIPE_PLANS[planType].features.maxUsers;

  if (maxUsers === -1) {
    return; // ilimitado
  }

  if (business.users.length >= maxUsers) {
    throw new PlanLimitsError(
      `Has alcanzado el límite de ${maxUsers} usuarios para el ${STRIPE_PLANS[planType].name}. Actualiza tu plan para agregar más usuarios.`
    );
  }
}

// Verificar acceso a funcionalidad
export async function checkFeatureAccess(
  businessId: string,
  feature: 'multiLocation' | 'advancedReports' | 'apiAccess' | 'invoicing'
): Promise<boolean> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business) {
    return false;
  }

  const planType = business.planType as PlanType;
  return STRIPE_PLANS[planType].features[feature] as boolean;
}

// Obtener información del plan actual
export async function getCurrentPlanInfo(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      subscription: true,
    },
  });

  if (!business) {
    throw new Error('Negocio no encontrado');
  }

  const planType = business.planType as PlanType;
  const planConfig = STRIPE_PLANS[planType];

  // Contar recursos actuales
  const [productCount, userCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { businessId, isActive: true } }),
  ]);

  // Contar ventas del mes
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const salesCount = await prisma.sale.count({
    where: {
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  return {
    planType,
    planName: planConfig.name,
    price: planConfig.price,
    features: planConfig.features,
    usage: {
      products: {
        current: productCount,
        limit: planConfig.features.maxProducts,
      },
      sales: {
        current: salesCount,
        limit: planConfig.features.maxSales,
      },
      users: {
        current: userCount,
        limit: planConfig.features.maxUsers,
      },
    },
    subscription: business.subscription,
  };
}
