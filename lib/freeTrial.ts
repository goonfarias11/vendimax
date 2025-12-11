import { prisma } from "@/lib/prisma";

export async function createFreeTrial(businessId: string): Promise<{
  success: boolean;
  subscriptionId?: string;
  error?: string;
}> {
  try {
    // Verificar si ya tuvo free trial
    const existingTrial = await prisma.subscriptionARS.findFirst({
      where: {
        businessId,
        freeTrial: true,
      },
    });

    if (existingTrial) {
      return {
        success: false,
        error: "Este negocio ya utilizó su prueba gratuita",
      };
    }

    // Crear suscripción de prueba
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 días

    // Obtener el plan PRO para vincular
    const proPlan = await prisma.subscriptionPlan.findFirst({
      where: { tier: "PRO" },
    });

    if (!proPlan) {
      return {
        success: false,
        error: "Plan PRO no encontrado en la base de datos",
      };
    }

    const subscription = await prisma.subscriptionARS.create({
      data: {
        businessId,
        planId: proPlan.id,
        planTier: "PRO", // Plan PRO durante la prueba
        status: "ACTIVE",
        freeTrial: true,
        trialEndsAt,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndsAt,
        billingCycle: "monthly",
        priceMonthly: 0, // Gratis durante el trial
        totalMonthly: 0,
      },
    });

    // Actualizar plan del negocio
    await prisma.business.update({
      where: { id: businessId },
      data: {
        planType: "PRO",
      },
    });

    return {
      success: true,
      subscriptionId: subscription.id,
    };
  } catch (error: any) {
    console.error("[createFreeTrial]", error);
    return {
      success: false,
      error: error.message || "Error al crear prueba gratuita",
    };
  }
}

export async function hasActiveSubscription(businessId: string): Promise<boolean> {
  try {
    const subscription = await prisma.subscriptionARS.findUnique({
      where: { businessId },
    });

    if (!subscription) return false;

    if (subscription.status !== "ACTIVE") return false;

    // Si está en trial, verificar que no haya expirado
    if (subscription.freeTrial && subscription.trialEndsAt) {
      return new Date() < subscription.trialEndsAt;
    }

    // Verificar que no esté vencida
    if (subscription.currentPeriodEnd) {
      return new Date() < subscription.currentPeriodEnd;
    }

    return true;
  } catch (error) {
    console.error("[hasActiveSubscription]", error);
    return false;
  }
}
