import { type Prisma, type SupportPriority, type SupportTicketStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { logAdminAction } from "@/lib/admin/logs"

export type SupportListFilters = {
  page: number
  pageSize: number
  status?: "all" | SupportTicketStatus
  priority?: "all" | SupportPriority
  search?: string
}

export type SupportTicketItem = {
  id: string
  subject: string
  requester: string
  status: SupportTicketStatus
  priority: SupportPriority
  messagesCount: number
  lastMessage: string
  createdAt: Date
  updatedAt: Date
}

export type SupportListResult = {
  items: SupportTicketItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type SupportTicketWithRelations = Prisma.SupportTicketGetPayload<{
  include: {
    user: {
      select: {
        name: true
        email: true
      }
    }
    messages: {
      orderBy: { createdAt: "desc" }
      take: 1
      select: { message: true }
    }
    _count: { select: { messages: true } }
  }
}>

export async function getSupportTickets(filters: SupportListFilters): Promise<SupportListResult> {
  const where: Prisma.SupportTicketWhereInput = {}

  if (filters.status && filters.status !== "all") {
    where.status = filters.status
  }

  if (filters.priority && filters.priority !== "all") {
    where.priority = filters.priority
  }

  if (filters.search) {
    where.OR = [
      { subject: { contains: filters.search, mode: "insensitive" } },
      { user: { is: { name: { contains: filters.search, mode: "insensitive" } } } },
      { user: { is: { email: { contains: filters.search, mode: "insensitive" } } } },
    ]
  }

  let total = 0
  let tickets: SupportTicketWithRelations[] = []

  try {
    ;[total, tickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              message: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
    ])
  } catch (error: any) {
    // Si la tabla no existe (ej. base demo sin migrar), devolvemos lista vacía
    const code = error?.code as string | undefined
    if (code === "P2021" || /does not exist/i.test(String(error?.message))) {
      total = 0
      tickets = []
      console.warn("Support tickets deshabilitado: tabla no existe aún (ok en demo).")
    } else {
      throw error
    }
  }

  return {
    items: tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      requester: ticket.user?.name || ticket.user?.email || "Cliente",
      status: ticket.status,
      priority: ticket.priority,
      messagesCount: ticket._count.messages,
      lastMessage: ticket.messages[0]?.message || "Sin mensajes",
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    })),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  }
}

export async function updateSupportTicket(params: {
  ticketId: string
  status?: SupportTicketStatus
  priority?: SupportPriority
  actorUserId?: string | null
}): Promise<void> {
  // Evitar crashear si la tabla no existe en un entorno demo
  const tableExists = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    "SELECT to_regclass('public.support_tickets') IS NOT NULL as exists"
  ).then((r) => r?.[0]?.exists === true).catch(() => false)
  if (!tableExists) {
    console.warn("updateSupportTicket omitido: tabla support_tickets no existe (demo).")
    return
  }

  const data: Prisma.SupportTicketUpdateInput = {}

  if (params.status) {
    data.status = params.status
    if (params.status === "closed" || params.status === "solved") {
      data.closedAt = new Date()
    }
  }

  if (params.priority) {
    data.priority = params.priority
  }

  await prisma.supportTicket.update({
    where: { id: params.ticketId },
    data,
  })

  await logAdminAction({
    actorUserId: params.actorUserId,
    event: "admin.support.update_ticket",
    description: "Actualizacion de ticket de soporte",
    metadata: {
      ticketId: params.ticketId,
      status: params.status,
      priority: params.priority,
    },
  })
}

export async function addInternalSupportMessage(params: {
  ticketId: string
  message: string
  actorUserId?: string | null
}): Promise<void> {
  const tableExists = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    "SELECT to_regclass('public.support_tickets') IS NOT NULL as exists"
  ).then((r) => r?.[0]?.exists === true).catch(() => false)
  if (!tableExists) {
    console.warn("addInternalSupportMessage omitido: tabla support_tickets no existe (demo).")
    return
  }

  await prisma.supportMessage.create({
    data: {
      ticketId: params.ticketId,
      userId: params.actorUserId,
      message: params.message,
      isInternal: true,
    },
  })

  await prisma.supportTicket.update({
    where: { id: params.ticketId },
    data: {
      status: "pending",
      updatedAt: new Date(),
    },
  })

  await logAdminAction({
    actorUserId: params.actorUserId,
    event: "admin.support.add_message",
    description: "Mensaje interno agregado en ticket",
    metadata: {
      ticketId: params.ticketId,
    },
  })
}
