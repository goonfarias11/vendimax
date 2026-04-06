import { type Prisma, type SystemLogLevel } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type LogAdminActionInput = {
  actorUserId?: string | null
  event: string
  description: string
  metadata?: Prisma.InputJsonValue
  level?: SystemLogLevel
  category?: string
  ipAddress?: string | null
}

export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        level: input.level ?? "info",
        category: input.category ?? "admin",
        event: input.event,
        description: input.description,
        metadata: input.metadata,
        actorUserId: input.actorUserId,
        ipAddress: input.ipAddress,
      },
    })
  } catch (error) {
    console.error("No se pudo registrar system log administrativo:", error)
  }
}
