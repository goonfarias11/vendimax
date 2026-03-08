/**
 * Servicio de auditoría
 * Registra todas las acciones críticas en el sistema
 */

import { prisma } from '@/lib/prisma'

export interface AuditLogData {
  businessId: string
  userId?: string
  action: string
  entity: string
  entityId?: string
  changes?: any
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
          changes: data.changes || null,
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
    const where: any = { businessId }

    if (options?.entity) {
      where.entity = options.entity
    }

    if (options?.userId) {
      where.userId = options.userId
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {}
      if (options.startDate) {
        where.createdAt.gte = options.startDate
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate
      }
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
  async logCreate(businessId: string, userId: string, entity: string, entityId: string, data: any) {
    await this.log({
      businessId,
      userId,
      action: 'CREATE',
      entity,
      entityId,
      changes: { new: data },
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
    oldData: any,
    newData: any
  ) {
    await this.log({
      businessId,
      userId,
      action: 'UPDATE',
      entity,
      entityId,
      changes: { old: oldData, new: newData },
    })
  }

  /**
   * Helper para crear log de eliminación
   */
  async logDelete(businessId: string, userId: string, entity: string, entityId: string, data: any) {
    await this.log({
      businessId,
      userId,
      action: 'DELETE',
      entity,
      entityId,
      changes: { deleted: data },
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
    metadata?: any
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
  AFIP_INVOICE: 'afip_invoice',
  PROMOTION: 'promotion',
  WEBHOOK: 'webhook',
  API_KEY: 'api_key',
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
