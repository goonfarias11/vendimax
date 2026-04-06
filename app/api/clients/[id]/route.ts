import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { requirePermission } from "@/lib/auth-middleware"
import { ClientStatus, Prisma } from "@prisma/client"
import { requireTenant } from "@/lib/security/tenant"
import { clientSchema } from "@/lib/validation/client.schema"
import { z } from "zod"

export const runtime = "nodejs"

type AuditChangeValue = string | number | boolean | null
type AuditChanges = Record<string, { from: AuditChangeValue; to: AuditChangeValue }>

async function logActivity(
  clientId: string,
  action: string,
  description: string,
  userId: string,
  metadata?: Prisma.InputJsonValue,
  ipAddress?: string,
) {
  try {
    await prisma.clientActivityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        clientId,
        action,
        description,
        userId,
        metadata,
        ipAddress,
        createdAt: new Date(),
      },
    })
  } catch (error) {
    logger.error("Error logging activity:", error)
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const permissionCheck = await requirePermission(request, "clients:view")
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const { id } = await params

    const client = await prisma.client.findFirst({
      where: {
        id,
        businessId: tenant,
      },
      include: {
        sales: {
          where: { businessId: tenant },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const salesMetrics = await prisma.sale.aggregate({
      where: {
        clientId: id,
        businessId: tenant,
        status: "COMPLETADO",
      },
      _sum: { total: true },
      _count: true,
    })

    return NextResponse.json({
      ...client,
      totalPurchased: salesMetrics._sum.total || 0,
      purchaseCount: salesMetrics._count,
      averageTicket: salesMetrics._count > 0 ? Number(salesMetrics._sum.total) / salesMetrics._count : 0,
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const permissionCheck = await requirePermission(request, "clients:edit")
    if (!permissionCheck.authorized) {
      return permissionCheck.response
    }

    const { id } = await params
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const body = await request.json()
    const parsed = clientSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 },
      )
    }

    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        businessId: tenant,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        taxId: true,
        notes: true,
        tags: true,
        creditLimit: true,
        hasCreditAccount: true,
        status: true,
        isActive: true,
      },
    })

    if (!existingClient) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const {
      name,
      email,
      phone,
      address,
      taxId,
      notes,
      tags,
      creditLimit,
      hasCreditAccount,
      status,
      isActive,
    } = parsed.data

    const changes: AuditChanges = {}
    if (name !== undefined && name !== existingClient.name) changes.name = { from: existingClient.name, to: name }
    if (email !== undefined && email !== existingClient.email)
      changes.email = { from: existingClient.email ?? null, to: email ?? null }
    if (phone !== undefined && phone !== existingClient.phone)
      changes.phone = { from: existingClient.phone ?? null, to: phone ?? null }
    if (creditLimit !== undefined && Number(creditLimit) !== Number(existingClient.creditLimit)) {
      changes.creditLimit = { from: Number(existingClient.creditLimit), to: Number(creditLimit) }
    }
    if (hasCreditAccount !== undefined && hasCreditAccount !== existingClient.hasCreditAccount) {
      changes.hasCreditAccount = { from: existingClient.hasCreditAccount, to: hasCreditAccount }
    }
    if (status !== undefined && status !== existingClient.status) {
      changes.status = { from: existingClient.status, to: status as ClientStatus }
    }

    const updateData: Prisma.ClientUpdateInput = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email || null
    if (phone !== undefined) updateData.phone = phone || null
    if (address !== undefined) updateData.address = address || null
    if (taxId !== undefined) updateData.taxId = taxId || null
    if (notes !== undefined) updateData.notes = notes || null
    if (tags !== undefined) updateData.tags = tags
    if (creditLimit !== undefined) updateData.creditLimit = creditLimit
    if (hasCreditAccount !== undefined) updateData.hasCreditAccount = hasCreditAccount
    if (status !== undefined) updateData.status = status as ClientStatus
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
    })

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    await logActivity(
      id,
      "UPDATE",
      `Cliente actualizado por ${session!.user.email}`,
      session!.user.id,
      changes as Prisma.InputJsonValue,
      ipAddress,
    )

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    const tenantResult = await requireTenant(session)
    if (!tenantResult.authorized) return tenantResult.response
    const tenant = tenantResult.tenant

    const client = await prisma.client.findFirst({
      where: {
        id,
        businessId: tenant,
      },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    if (client._count.sales > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un cliente con ventas registradas" },
        { status: 400 },
      )
    }

    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Cliente eliminado" })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
