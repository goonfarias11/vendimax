import type { Prisma, SystemSetting } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { logAdminAction } from "@/lib/admin/logs"

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export type AdminSettings = {
  platformName: string
  featureFlags: Record<string, unknown>
  emailSystem: Record<string, unknown>
  plans: Array<{
    id: string
    name: string
    priceMonthly: number
    priceYearly: number
    isActive: boolean
  }>
}

export type UpdateAdminSettingsInput = {
  platformName?: string
  featureFlags?: Record<string, unknown>
  emailSystem?: Record<string, unknown>
  plans?: Array<{
    id: string
    priceMonthly?: number
    priceYearly?: number
    isActive?: boolean
  }>
}

function toInputJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined
  }

  return value as unknown as Prisma.InputJsonValue
}

export async function getAdminSettings(): Promise<AdminSettings> {
  let settings: SystemSetting | null = null
  let plans: Array<{
    id: string
    name: string
    priceMonthly: Prisma.Decimal
    priceYearly: Prisma.Decimal
    isActive: boolean
  }> = []

  try {
    ;[settings, plans] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { id: "global" } }),
      prisma.subscriptionPlan.findMany({
        orderBy: { priceMonthly: "asc" },
        select: {
          id: true,
          name: true,
          priceMonthly: true,
          priceYearly: true,
          isActive: true,
        },
      }),
    ])
  } catch (error: any) {
    const code = error?.code as string | undefined
    const msg = (error as Error)?.message ?? String(error)
    if (code === "P2021" || /system_settings.*does not exist/i.test(msg)) {
      // Base demo sin tabla: devolvemos defaults y no reventamos el panel
      console.warn("Tabla system_settings no existe; usando valores por defecto.")
      settings = null
      plans = []
    } else {
      throw error
    }
  }

  return {
    platformName: settings?.platformName ?? "VendiMax",
    featureFlags: asRecord(settings?.featureFlags ?? {}),
    emailSystem: asRecord(settings?.emailSystem ?? {}),
    plans: plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: Number(plan.priceYearly),
      isActive: plan.isActive,
    })),
  }
}

export async function updateAdminSettings(
  input: UpdateAdminSettingsInput,
  actorUserId?: string | null
): Promise<void> {
  const tableExists = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    "SELECT to_regclass('public.system_settings') IS NOT NULL as exists"
  ).then((r) => r?.[0]?.exists === true).catch(() => false)
  if (!tableExists) {
    console.warn("updateAdminSettings omitido: tabla system_settings no existe (demo).")
    return
  }

  await prisma.$transaction(async (tx) => {
    await tx.systemSetting.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        platformName: input.platformName ?? "VendiMax",
        featureFlags: toInputJson(input.featureFlags) ?? {},
        emailSystem: toInputJson(input.emailSystem) ?? {},
        updatedById: actorUserId,
      },
      update: {
        platformName: input.platformName,
        featureFlags: toInputJson(input.featureFlags),
        emailSystem: toInputJson(input.emailSystem),
        updatedById: actorUserId,
      },
    })

    if (input.plans?.length) {
      for (const plan of input.plans) {
        await tx.subscriptionPlan.update({
          where: { id: plan.id },
          data: {
            priceMonthly: plan.priceMonthly,
            priceYearly: plan.priceYearly,
            isActive: plan.isActive,
          },
        })
      }
    }
  })

  await logAdminAction({
    actorUserId,
    event: "admin.settings.update",
    description: "Actualizacion de configuraciones globales",
    metadata: {
      platformName: input.platformName,
      plansUpdated: input.plans?.length ?? 0,
    },
  })
}
