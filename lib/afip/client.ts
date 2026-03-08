/**
 * Cliente principal de AFIP
 * Expone todas las funcionalidades de facturación electrónica
 */

import { WSAAClient } from './wsaa'
import { WSFEv1Client } from './wsfev1'
import type { AfipConfig, AfipAuth, AfipInvoiceRequest, AfipInvoiceResponse } from './types'

export class AfipClient {
  private config: AfipConfig
  private wsaa: WSAAClient
  private wsfev1: WSFEv1Client
  private cachedAuth?: AfipAuth

  constructor(config: AfipConfig) {
    this.config = config
    this.wsaa = new WSAAClient(config)
    this.wsfev1 = new WSFEv1Client(config)
  }

  /**
   * Obtiene la autenticación con AFIP
   */
  private async getAuth(): Promise<AfipAuth> {
    if (this.cachedAuth && this.cachedAuth.expiresAt > new Date()) {
      return this.cachedAuth
    }

    this.cachedAuth = await this.wsaa.getAuth('wsfe')
    return this.cachedAuth
  }

  /**
   * Obtiene el último número de comprobante
   */
  async getLastVoucher(pointOfSale: number, voucherType: number): Promise<number> {
    const auth = await this.getAuth()
    return await this.wsfev1.getLastVoucher(auth, pointOfSale, voucherType)
  }

  /**
   * Crea una factura electrónica
   */
  async createInvoice(invoice: AfipInvoiceRequest): Promise<AfipInvoiceResponse> {
    const auth = await this.getAuth()
    
    // Obtener el número de comprobante
    const lastVoucher = await this.getLastVoucher(invoice.pointOfSale, invoice.voucherType)
    const voucherNumber = lastVoucher + 1

    // Agregar el número de comprobante al request
    const invoiceWithNumber = {
      ...invoice,
      voucherNumber,
    }

    return await this.wsfev1.createInvoice(auth, invoiceWithNumber)
  }

  /**
   * Obtiene los puntos de venta configurados
   */
  async getPointsOfSale() {
    const auth = await this.getAuth()
    return await this.wsfev1.getPointsOfSale(auth)
  }

  /**
   * Obtiene los tipos de comprobante disponibles
   */
  async getVoucherTypes() {
    const auth = await this.getAuth()
    return await this.wsfev1.getVoucherTypes(auth)
  }

  /**
   * Obtiene los tipos de documento disponibles
   */
  async getDocumentTypes() {
    const auth = await this.getAuth()
    return await this.wsfev1.getDocumentTypes(auth)
  }

  /**
   * Limpia el cache de autenticación
   */
  clearAuthCache(): void {
    this.cachedAuth = undefined
    this.wsaa.clearCache()
  }
}

/**
 * Factory para crear instancias del cliente AFIP
 */
export function createAfipClient(config?: Partial<AfipConfig>): AfipClient {
  const defaultConfig: AfipConfig = {
    cuit: process.env.AFIP_CUIT || '',
    cert: process.env.AFIP_CERT || '',
    key: process.env.AFIP_KEY || '',
    production: process.env.AFIP_PRODUCTION === 'true',
  }

  return new AfipClient({ ...defaultConfig, ...config })
}

export * from './types'
export { WSAAClient } from './wsaa'
export { WSFEv1Client } from './wsfev1'
