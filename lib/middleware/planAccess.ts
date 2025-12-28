import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUpgradeRecommendation } from "@/lib/planAccessControl";

interface PlanLimits {
  products: number;
  sales: number;
  users: number;
  locations: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    products: 50,
    sales: 100,
    users: 1,
    locations: 1,
  },
  STARTER: {
    products: 500,
    sales: 1000,
    users: 3,
    locations: 1,
  },
  PRO: {
    products: 5000,
    sales: 10000,
    users: 10,
    locations: 3,
  },
  ENTERPRISE: {
    products: 999999,
    sales: 999999,
    users: 999999,
    locations: 999999,
  },
};

export async function checkPlanLimit(
  businessId: string,
  limitType: keyof PlanLimits,
  incrementBy: number = 1
): Promise<{
  allowed: boolean;
  currentUsage: number;
  limit: number;
  recommendation?: any;
  error?: string;
}> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        planType: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!business) {
      return {
        allowed: false,
        currentUsage: 0,
        limit: 0,
        error: "Negocio no encontrado",
      };
    }

    const limits = PLAN_LIMITS[business.planType] || PLAN_LIMITS.FREE;
    const limit = limits[limitType];
    let currentUsage = 0;

    // Obtener uso actual según el tipo
    switch (limitType) {
      case "products":
        currentUsage = await prisma.product.count({
          where: { isActive: true },
        });
        break;

      case "sales":
        // Ventas del mes actual
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        currentUsage = await prisma.sale.count({
          where: {
            user: {
              businessId: businessId,
            },
            createdAt: {
              gte: monthStart,
            },
          },
        });
        break;

      case "users":
        currentUsage = business._count.users;
        break;

      case "locations":
        // Por ahora no implementado, siempre 1
        currentUsage = 1;
        break;
    }

    const futureUsage = currentUsage + incrementBy;
    const allowed = futureUsage <= limit;

    // Si supera el límite, registrar bloqueo y obtener recomendación
    if (!allowed) {
      await prisma.planBlockLog.create({
        data: {
          businessId,
          type: "LIMIT",
          reason: `Límite de ${limitType} alcanzado`,
          metadata: {
            limitType,
            currentUsage,
            limit,
            attempted: incrementBy,
          },
        },
      });

      const recommendation = await getUpgradeRecommendation(businessId);

      return {
        allowed: false,
        currentUsage,
        limit,
        recommendation,
        error: `Has alcanzado el límite de ${limit} ${limitType} de tu plan ${business.planType}`,
      };
    }

    // Advertencia al 80%
    if (futureUsage >= limit * 0.8) {
      const recommendation = await getUpgradeRecommendation(businessId);
      return {
        allowed: true,
        currentUsage,
        limit,
        recommendation,
      };
    }

    return {
      allowed: true,
      currentUsage,
      limit,
    };
  } catch (error: any) {
    console.error("[checkPlanLimit]", error);
    return {
      allowed: true, // En caso de error, permitir para no romper el sistema
      currentUsage: 0,
      limit: 0,
    };
  }
}

export async function checkSubscriptionStatus(businessId: string): Promise<{
  active: boolean;
  reason?: string;
  recommendation?: any;
}> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscriptionARS: true,
      },
    });

    if (!business) {
      return { active: false, reason: "Negocio no encontrado" };
    }

    // Si tiene free trial activo
    if (business.subscriptionARS?.freeTrial) {
      const trialEnd = business.subscriptionARS.trialEndsAt;
      if (trialEnd && new Date() > trialEnd) {
        await prisma.planBlockLog.create({
          data: {
            businessId,
            type: "EXPIRED",
            reason: "Prueba gratuita expirada",
          },
        });

        const recommendation = await getUpgradeRecommendation(businessId);
        return {
          active: false,
          reason: "Tu prueba gratuita ha expirado. Suscríbete para continuar.",
          recommendation,
        };
      }
      return { active: true };
    }

    // Verificar suscripción activa
    if (business.subscriptionARS) {
      if (business.subscriptionARS.status !== "ACTIVE") {
        await prisma.planBlockLog.create({
          data: {
            businessId,
            type: "EXPIRED",
            reason: `Suscripción ${business.subscriptionARS.status}`,
          },
        });

        const recommendation = await getUpgradeRecommendation(businessId);
        return {
          active: false,
          reason: "Tu suscripción no está activa. Actualiza tu pago para continuar.",
          recommendation,
        };
      }

      // Verificar vencimiento
      if (business.subscriptionARS.currentPeriodEnd && new Date() > business.subscriptionARS.currentPeriodEnd) {
        await prisma.planBlockLog.create({
          data: {
            businessId,
            type: "EXPIRED",
            reason: "Suscripción vencida",
          },
        });

        const recommendation = await getUpgradeRecommendation(businessId);
        return {
          active: false,
          reason: "Tu suscripción ha vencido. Renueva tu plan para continuar.",
          recommendation,
        };
      }

      return { active: true };
    }

    // Sin suscripción
    return {
      active: false,
      reason: "No tienes una suscripción activa",
    };
  } catch (error: any) {
    console.error("[checkSubscriptionStatus]", error);
    return { active: true }; // Permitir en caso de error
  }
}

export function planLimitResponse(result: Awaited<ReturnType<typeof checkPlanLimit>>) {
  return NextResponse.json(
    {
      error: result.error || "Límite del plan alcanzado",
      currentUsage: result.currentUsage,
      limit: result.limit,
      upgrade: result.recommendation,
    },
    { status: 403 }
  );
}

export function subscriptionExpiredResponse(result: Awaited<ReturnType<typeof checkSubscriptionStatus>>) {
  return NextResponse.json(
    {
      error: result.reason || "Suscripción inactiva",
      upgrade: result.recommendation,
    },
    { status: 403 }
  );
}
