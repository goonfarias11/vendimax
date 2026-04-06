/**
 * Servicio de auditoría
 * Registra todas las acciones críticas en el sistema
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface AuditLogData {
  businessId: string
  userId?: string
  action: string
  entity: string
  entityId?: string
  changes?: Prisma.InputJsonValue
  ipAddress?: string
  userAgent?: string
}

export class AuditService {
  /**
   * Registra una acción en el log de auditoría
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          businessId: data.businessId,
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          changes: data.changes ?? Prisma.JsonNull,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      })
    } catch (error) {
      console.error('Error creando log de auditoría:', error)
    }
  }

  /**
   * Obtiene logs de auditoría
   */
  async getLogs(
    businessId: string,
    options?: {
      entity?: string
      userId?: string
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ) {
    const where: Prisma.AuditLogWhereInput = { businessId }

    if (options?.entity) {
      where.entity = options.entity
    }

    if (options?.userId) {
      where.userId = options.userId
    }

    if (options?.startDate || options?.endDate) {
      const createdAt: Prisma.DateTimeFilter = {}
      if (options.startDate) {
        createdAt.gte = options.startDate
      }
      if (options.endDate) {
        createdAt.lte = options.endDate
      }
      where.createdAt = createdAt
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit || 100,
    })
  }

  /**
   * Helper para crear log de creación
   */
  async logCreate(
    businessId: string,
    userId: string,
    entity: string,
    entityId: string,
    data: Prisma.InputJsonValue
  ) {
    await this.log({
      businessId,
      userId,
      action: 'CREATE',
      entity,
      entityId,
      changes: { new: data } as Prisma.InputJsonValue,
    })
  }

  /**
   * Helper para crear log de actualización
   */
  async logUpdate(
    businessId: string,
    userId: string,
    entity: string,
    entityId: string,
    oldData: Prisma.InputJsonValue,
    newData: Prisma.InputJsonValue
  ) {
    await this.log({
      businessId,
      userId,
      action: 'UPDATE',
      entity,
      entityId,
      changes: { old: oldData, new: newData } as Prisma.InputJsonValue,
    })
  }

  /**
   * Helper para crear log de eliminación
   */
  async logDelete(
    businessId: string,
    userId: string,
    entity: string,
    entityId: string,
    data: Prisma.InputJsonValue
  ) {
    await this.log({
      businessId,
      userId,
      action: 'DELETE',
      entity,
      entityId,
      changes: { deleted: data } as Prisma.InputJsonValue,
    })
  }

  /**
   * Helper para crear log de acciones especiales
   */
  async logAction(
    businessId: string,
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    metadata?: Prisma.InputJsonValue
  ) {
    await this.log({
      businessId,
      userId,
      action,
      entity,
      entityId,
      changes: metadata,
    })
  }
}

export const auditService = new AuditService()

// Constantes de entidades auditables
export const AUDIT_ENTITIES = {
  PRODUCT: 'product',
  SALE: 'sale',
  CLIENT: 'client',
  USER: 'user',
  PRICE: 'price',
  STOCK: 'stock',
  CASH_REGISTER: 'cash_register',
  CASH_CLOSING: 'cash_closing',
  ARCA_INVOICE: 'afip_invoice',
  AFIP_INVOICE: 'afip_invoice',
  PROMOTION: 'promotion',
  WEBHOOK: 'webhook',
  API_KEY: 'api_key',
  BUSINESS: 'business',
} as const

// Constantes de acciones auditables
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PRICE_CHANGE: 'PRICE_CHANGE',
  STOCK_ADJUSTMENT: 'STOCK_ADJUSTMENT',
  CASH_OPEN: 'CASH_OPEN',
  CASH_CLOSE: 'CASH_CLOSE',
  REFUND: 'REFUND',
  INVOICE_GENERATE: 'INVOICE_GENERATE',
} as const
