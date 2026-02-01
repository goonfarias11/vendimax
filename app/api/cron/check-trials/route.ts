import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTrialExpiringSoonEmail, sendTrialExpiredEmail } from "@/lib/email";

// Este endpoint debe ser llamado diariamente por un servicio cron (ej: Vercel Cron, cron-job.org)
// Verificar la configuración en vercel.json

export async function GET(req: NextRequest) {
  try {
    // Verificar autorización (token secreto para cron jobs)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // 1. Buscar trials que expiran en 3 días (para notificar)
    const trialsExpiringSoon = await prisma.subscriptionARS.findMany({
      where: {
        freeTrial: true,
        status: "active",
        trialEndsAt: {
          gte: now,
          lte: threeDaysFromNow,
        },
        trialNotificationSent: false, // Solo notificar una vez
      },
      include: {
        business: {
          include: {
            users: {
              where: { role: "OWNER" },
              take: 1,
            },
          },
        },
        plan: true,
      },
    });

    // 2. Buscar trials que ya expiraron (para convertir o degradar)
    const expiredTrials = await prisma.subscriptionARS.findMany({
      where: {
        freeTrial: true,
        status: "active",
        trialEndsAt: {
          lt: now,
        },
      },
      include: {
        business: {
          include: {
            users: {
              where: { role: "OWNER" },
              take: 1,
            },
          },
        },
        plan: true,
      },
    });

    const results = {
      notificationsSent: 0,
      trialsExpired: 0,
      errors: [] as string[],
    };

    // Procesar notificaciones para trials que expiran pronto
    for (const trial of trialsExpiringSoon) {
      try {
        const owner = trial.business.users[0];
        if (!owner) continue;

        const daysRemaining = Math.ceil(
          (trial.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        await sendTrialExpiringSoonEmail({
          to: owner.email,
          name: owner.name,
          daysRemaining,
          planName: trial.plan.name,
          monthlyPrice: Number(trial.plan.priceMonthly),
          subscriptionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion`,
        });

        // Marcar como notificado
        await prisma.subscriptionARS.update({
          where: { id: trial.id },
          data: { trialNotificationSent: true },
        });

        results.notificationsSent++;
      } catch (error) {
        console.error(`Error notificando trial ${trial.id}:`, error);
        results.errors.push(`Notification error for trial ${trial.id}`);
      }
    }

    // Procesar trials expirados
    for (const trial of expiredTrials) {
      try {
        const owner = trial.business.users[0];
        if (!owner) continue;

        // Degradar a plan FREE
        await prisma.$transaction(async (tx) => {
          // Actualizar estado de la suscripción trial
          await tx.subscriptionARS.update({
            where: { id: trial.id },
            data: {
              status: "expired",
            },
          });

          // Cambiar el negocio a plan FREE
          await tx.business.update({
            where: { id: trial.businessId },
            data: {
              planType: "FREE",
            },
          });

          // Registrar el bloqueo
          await tx.planBlockLog.create({
            data: {
              businessId: trial.businessId,
              type: "EXPIRED",
              reason: "Prueba gratuita expirada - Degradado a plan FREE",
            },
          });
        });

        // Enviar email informando
        await sendTrialExpiredEmail({
          to: owner.email,
          name: owner.name,
          planName: trial.plan.name,
          monthlyPrice: Number(trial.plan.priceMonthly),
          subscriptionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion`,
          freePlanLimits: {
            products: 50,
            sales: 100,
            users: 1,
          },
        });

        results.trialsExpired++;
      } catch (error) {
        console.error(`Error procesando trial expirado ${trial.id}:`, error);
        results.errors.push(`Expiration error for trial ${trial.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("[GET /api/cron/check-trials]", error);
    return NextResponse.json(
      { error: "Error al procesar trials" },
      { status: 500 }
    );
  }
}
