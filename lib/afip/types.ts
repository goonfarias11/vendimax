/**
 * Tipos para integración con AFIP
 * WSFEv1 - Web Service de Facturación Electrónica versión 1
 */

export interface AfipConfig {
  cuit: string
  certPath?: string
  keyPath?: string
  cert?: string
  key?: string
  production: boolean
}

export interface AfipCredentials {
  token: string
  sign: string
  expirationTime: Date
}

export interface WSAALoginTicketRequest {
  service: string
}

export interface WSAALoginTicketResponse {
  token: string
  sign: string
  expirationTime: string
}

export interface AfipAuth {
  token: string
  sign: string
  expiresAt: Date
}

export interface AfipVoucherType {
  code: number
  name: string
  description: string
}

export interface AfipDocumentType {
  code: number
  name: string
}

export interface AfipConceptType {
  code: number
  name: string
  description: string
}

export interface AfipTaxType {
  code: number
  name: string
  description: string
}

export interface AfipInvoiceRequest {
  pointOfSale: number
  voucherType: number
  concept: number
  documentType: number
  documentNumber: number
  invoiceDate: string // YYYYMMDD
  totalAmount: number
  netAmount: number
  exemptAmount: number
  serviceFrom?: string // YYYYMMDD
  serviceTo?: string // YYYYMMDD
  expirationDate?: string // YYYYMMDD
  taxes?: AfipTax[]
  associatedVouchers?: AfipAssociatedVoucher[]
}

export interface AfipTax {
  id: number
  description: string
  baseAmount: number
  amount: number
}

export interface AfipAssociatedVoucher {
  type: number
  pointOfSale: number
  number: number
  cuit?: string
}

export interface AfipInvoiceResponse {
  cae: string
  caeDueDate: string
  voucherNumber: number
  result: 'A' | 'R' | 'P' // Aprobado, Rechazado, Parcial
  observations?: AfipObservation[]
  errors?: AfipError[]
}

export interface AfipObservation {
  code: number
  message: string
}

export interface AfipError {
  code: number
  message: string
}

export interface AfipLastVoucherResponse {
  lastVoucher: number
}

export interface AfipPointOfSaleInfo {
  number: number
  emissionType: string
  blocked: boolean
  dropDate?: string
}

// Tipos de comprobante más comunes
export const VOUCHER_TYPES = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  FACTURA_C: 11,
  NOTA_DEBITO_A: 2,
  NOTA_DEBITO_B: 7,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_A: 3,
  NOTA_CREDITO_B: 8,
  NOTA_CREDITO_C: 13,
} as const

// Tipos de documento
export const DOCUMENT_TYPES = {
  CUIT: 80,
  CUIL: 86,
  CDI: 87,
  LE: 89,
  LC: 90,
  CI_EXTRANJERA: 91,
  EN_TRAMITE: 92,
  ACTA_NACIMIENTO: 93,
  CI_BS_AS_RNP: 95,
  DNI: 96,
  PASAPORTE: 94,
  SIN_IDENTIFICAR: 99,
} as const

// Tipos de concepto
export const CONCEPT_TYPES = {
  PRODUCTOS: 1,
  SERVICIOS: 2,
  PRODUCTOS_Y_SERVICIOS: 3,
} as const

// IVA
export const IVA_TYPES = {
  IVA_21: 5,
  IVA_10_5: 4,
  IVA_27: 6,
  IVA_5: 8,
  IVA_2_5: 9,
  IVA_0: 3,
  EXENTO: 2,
  NO_GRAVADO: 1,
} as const

export type VoucherType = typeof VOUCHER_TYPES[keyof typeof VOUCHER_TYPES]
export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES]
export type ConceptType = typeof CONCEPT_TYPES[keyof typeof CONCEPT_TYPES]
export type IvaType = typeof IVA_TYPES[keyof typeof IVA_TYPES]
