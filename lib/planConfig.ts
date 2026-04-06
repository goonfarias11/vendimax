export const PLAN_CONFIGS = {
  FREE: {
    name: 'Plan Free',
    price: 0,
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
    price: 850000,
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
    price: 1400000,
    features: {
      maxProducts: -1,
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
    price: 2200000,
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

export type PlanType = keyof typeof PLAN_CONFIGS;
