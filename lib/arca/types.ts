/**
 * Alias ARCA para tipos y constantes legacy de AFIP.
 */

import type {
  AfipConfig,
  AfipAuth,
  AfipInvoiceRequest,
  AfipInvoiceResponse,
  AfipDocumentType,
  AfipVoucherType,
} from "@/lib/afip/types"

export type ArcaConfig = AfipConfig
export type ArcaAuth = AfipAuth
export type ArcaInvoiceRequest = AfipInvoiceRequest
export type ArcaInvoiceResponse = AfipInvoiceResponse
export type ArcaDocumentType = AfipDocumentType
export type ArcaVoucherType = AfipVoucherType

export * from "@/lib/afip/types"
