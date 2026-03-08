/**
 * WSFEv1 - Web Service de Facturación Electrónica versión 1
 * Cliente para generar facturas electrónicas con AFIP
 */

import { parseStringPromise } from 'xml2js'
import type { 
  AfipAuth, 
  AfipConfig, 
  AfipInvoiceRequest, 
  AfipInvoiceResponse,
  AfipLastVoucherResponse,
  AfipPointOfSaleInfo,
  AfipVoucherType,
  AfipDocumentType,
  AfipConceptType
} from './types'

const WSFEV1_URL_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
const WSFEV1_URL_TEST = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'

export class WSFEv1Client {
  private config: AfipConfig

  constructor(config: AfipConfig) {
    this.config = config
  }

  /**
   * Obtiene el último número de comprobante autorizado
   */
  async getLastVoucher(
    auth: AfipAuth,
    pointOfSale: number,
    voucherType: number
  ): Promise<number> {
    const soapRequest = this.buildSOAPRequest('FECompUltimoAutorizado', auth, {
      PtoVta: pointOfSale,
      CbteTipo: voucherType,
    })

    const response = await this.sendSOAPRequest(soapRequest)
    const result = await parseStringPromise(response)

    const lastVoucher = result['soap:Envelope']['soap:Body'][0]['FECompUltimoAutorizadoResponse'][0]['FECompUltimoAutorizadoResult'][0]['CbteNro'][0]

    return parseInt(lastVoucher)
  }

  /**
   * Genera una factura electrónica
   */
  async createInvoice(
    auth: AfipAuth,
    invoice: AfipInvoiceRequest
  ): Promise<AfipInvoiceResponse> {
    // Construir el request
    const feCAEReq = {
      FeCabReq: {
        CantReg: 1,
        PtoVta: invoice.pointOfSale,
        CbteTipo: invoice.voucherType,
      },
      FeDetReq: {
        FECAEDetRequest: {
          Concepto: invoice.concept,
          DocTipo: invoice.documentType,
          DocNro: invoice.documentNumber,
          CbteDesde: 0, // Se obtiene del último comprobante + 1
          CbteHasta: 0,
          CbteFch: invoice.invoiceDate,
          ImpTotal: invoice.totalAmount,
          ImpTotConc: 0,
          ImpNeto: invoice.netAmount,
          ImpOpEx: invoice.exemptAmount,
          ImpIVA: invoice.totalAmount - invoice.netAmount,
          ImpTrib: 0,
          FchServDesde: invoice.serviceFrom,
          FchServHasta: invoice.serviceTo,
          FchVtoPago: invoice.expirationDate,
          MonId: 'PES',
          MonCotiz: 1,
          ...(invoice.taxes && invoice.taxes.length > 0 && {
            Iva: {
              AlicIva: invoice.taxes.map(tax => ({
                Id: tax.id,
                BaseImp: tax.baseAmount,
                Importe: tax.amount,
              })),
            },
          }),
          ...(invoice.associatedVouchers && invoice.associatedVouchers.length > 0 && {
            CbtesAsoc: {
              CbteAsoc: invoice.associatedVouchers.map(voucher => ({
                Tipo: voucher.type,
                PtoVta: voucher.pointOfSale,
                Nro: voucher.number,
                ...(voucher.cuit && { Cuit: voucher.cuit }),
              })),
            },
          }),
        },
      },
    }

    const soapRequest = this.buildSOAPRequest('FECAESolicitar', auth, { FeCAEReq: feCAEReq })

    const response = await this.sendSOAPRequest(soapRequest)
    const result = await parseStringPromise(response)

    const caeSolicitarResult = result['soap:Envelope']['soap:Body'][0]['FECAESolicitarResponse'][0]['FECAESolicitarResult'][0]
    
    const feCabResp = caeSolicitarResult['FeCabResp'][0]
    const feDetResp = caeSolicitarResult['FeDetResp'][0]['FECAEDetResponse'][0]

    // Verificar si hay errores
    if (caeSolicitarResult['Errors']) {
      const errors = caeSolicitarResult['Errors'][0]['Err'].map((err: any) => ({
        code: parseInt(err['Code'][0]),
        message: err['Msg'][0],
      }))
      throw new Error(`Error AFIP: ${errors.map((e: any) => e.message).join(', ')}`)
    }

    return {
      cae: feDetResp['CAE']?.[0] || '',
      caeDueDate: feDetResp['CAEFchVto']?.[0] || '',
      voucherNumber: parseInt(feDetResp['CbteDesde']?.[0] || '0'),
      result: feDetResp['Resultado']?.[0] || 'R',
      observations: feDetResp['Observaciones']?.[0]?.['Obs']?.map((obs: any) => ({
        code: parseInt(obs['Code'][0]),
        message: obs['Msg'][0],
      })),
    }
  }

  /**
   * Obtiene los puntos de venta configurados
   */
  async getPointsOfSale(auth: AfipAuth): Promise<AfipPointOfSaleInfo[]> {
    const soapRequest = this.buildSOAPRequest('FEParamPtosVenta', auth, {})

    const response = await this.sendSOAPRequest(soapRequest)
    const result = await parseStringPromise(response)

    const ptosVenta = result['soap:Envelope']['soap:Body'][0]['FEParamPtosVentaResponse'][0]['FEParamPtosVentaResult'][0]['ResultGet'][0]['PtoVenta']

    return ptosVenta.map((pto: any) => ({
      number: parseInt(pto['Nro'][0]),
      emissionType: pto['EmisionTipo'][0],
      blocked: pto['Bloqueado'][0] === 'S',
      dropDate: pto['FchBaja']?.[0],
    }))
  }

  /**
   * Obtiene los tipos de comprobante disponibles
   */
  async getVoucherTypes(auth: AfipAuth): Promise<AfipVoucherType[]> {
    const soapRequest = this.buildSOAPRequest('FEParamTiposCbte', auth, {})

    const response = await this.sendSOAPRequest(soapRequest)
    const result = await parseStringPromise(response)

    const tipos = result['soap:Envelope']['soap:Body'][0]['FEParamTiposCbteResponse'][0]['FEParamTiposCbteResult'][0]['ResultGet'][0]['CbteTipo']

    return tipos.map((tipo: any) => ({
      code: parseInt(tipo['Id'][0]),
      name: tipo['Desc'][0],
      description: tipo['Desc'][0],
    }))
  }

  /**
   * Obtiene los tipos de documento disponibles
   */
  async getDocumentTypes(auth: AfipAuth): Promise<AfipDocumentType[]> {
    const soapRequest = this.buildSOAPRequest('FEParamTiposDoc', auth, {})

    const response = await this.sendSOAPRequest(soapRequest)
    const result = await parseStringPromise(response)

    const tipos = result['soap:Envelope']['soap:Body'][0]['FEParamTiposDocResponse'][0]['FEParamTiposDocResult'][0]['ResultGet'][0]['DocTipo']

    return tipos.map((tipo: any) => ({
      code: parseInt(tipo['Id'][0]),
      name: tipo['Desc'][0],
    }))
  }

  /**
   * Construye una solicitud SOAP
   */
  private buildSOAPRequest(method: string, auth: AfipAuth, params: any): string {
    const paramsXml = this.objectToXml(params)

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Header/>
  <soap:Body>
    <ar:${method}>
      <ar:Auth>
        <ar:Token>${auth.token}</ar:Token>
        <ar:Sign>${auth.sign}</ar:Sign>
        <ar:Cuit>${this.config.cuit}</ar:Cuit>
      </ar:Auth>
      ${paramsXml}
    </ar:${method}>
  </soap:Body>
</soap:Envelope>`
  }

  /**
   * Convierte un objeto a XML
   */
  private objectToXml(obj: any, parentKey?: string): string {
    let xml = ''

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue

      if (typeof value === 'object' && !Array.isArray(value)) {
        xml += `<ar:${key}>${this.objectToXml(value)}</ar:${key}>`
      } else if (Array.isArray(value)) {
        for (const item of value) {
          xml += this.objectToXml(item, key)
        }
      } else {
        xml += `<ar:${parentKey || key}>${value}</ar:${parentKey || key}>`
      }
    }

    return xml
  }

  /**
   * Envía una solicitud SOAP a AFIP
   */
  private async sendSOAPRequest(soapRequest: string): Promise<string> {
    const url = this.config.production ? WSFEV1_URL_PROD : WSFEV1_URL_TEST

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
      },
      body: soapRequest,
    })

    if (!response.ok) {
      throw new Error(`Error en WSFEv1: ${response.statusText}`)
    }

    return await response.text()
  }
}
