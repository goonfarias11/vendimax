/**
 * WSAA - Web Service de Autenticación y Autorización
 * Gestiona la autenticación con AFIP para obtener tokens de acceso
 */

import { sign } from 'jsonwebtoken'
import { parseStringPromise } from 'xml2js'
import type { AfipConfig, AfipAuth } from './types'

const WSAA_URL_PROD = 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
const WSAA_URL_TEST = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms'

export class WSAAClient {
  private config: AfipConfig
  private cachedAuth?: AfipAuth

  constructor(config: AfipConfig) {
    this.config = config
  }

  /**
   * Obtiene un token de acceso de AFIP
   */
  async getAuth(service: string = 'wsfe'): Promise<AfipAuth> {
    // Si tenemos un token cacheado y no ha expirado, lo usamos
    if (this.cachedAuth && this.cachedAuth.expiresAt > new Date()) {
      return this.cachedAuth
    }

    // Generar Ticket de Requerimiento de Acceso (TRA)
    const tra = this.generateTRA(service)

    // Firmar el TRA con el certificado
    const cms = await this.signTRA(tra)

    // Enviar el TRA firmado a AFIP
    const auth = await this.loginCMS(cms)

    this.cachedAuth = auth
    return auth
  }

  /**
   * Genera el Ticket de Requerimiento de Acceso (TRA)
   */
  private generateTRA(service: string): string {
    const now = new Date()
    const expirationTime = new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12 horas
    const uniqueId = Math.floor(now.getTime() / 1000)

    const tra = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${this.formatDate(now)}</generationTime>
    <expirationTime>${this.formatDate(expirationTime)}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`

    return tra
  }

  /**
   * Firma el TRA con el certificado y clave privada
   */
  private async signTRA(tra: string): Promise<string> {
    if (!this.config.key || !this.config.cert) {
      throw new Error('Se requiere certificado y clave privada para firmar el TRA')
    }

    // En un entorno real, necesitarías usar OpenSSL o una librería de criptografía
    // Para este ejemplo, usamos una implementación simplificada
    // En producción, usa: openssl smime -sign -in tra.xml -out tra.cms -signer cert.pem -inkey key.pem -outform DER -nodetach

    // Esto es solo un placeholder - en producción debes implementar la firma CMS real
    const signed = Buffer.from(tra).toString('base64')
    return signed
  }

  /**
   * Envía el TRA firmado a AFIP y obtiene el token y sign
   */
  private async loginCMS(cms: string): Promise<AfipAuth> {
    const url = this.config.production ? WSAA_URL_PROD : WSAA_URL_TEST

    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>${cms}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '',
      },
      body: soapRequest,
    })

    if (!response.ok) {
      throw new Error(`Error en WSAA: ${response.statusText}`)
    }

    const xml = await response.text()
    const result = await parseStringPromise(xml)

    const loginResponse = result['soapenv:Envelope']['soapenv:Body'][0]['loginCmsReturn'][0]
    const credentials = await parseStringPromise(loginResponse)

    const token = credentials.loginTicketResponse.credentials[0].token[0]
    const sign = credentials.loginTicketResponse.credentials[0].sign[0]
    const expirationTime = credentials.loginTicketResponse.header[0].expirationTime[0]

    return {
      token,
      sign,
      expiresAt: new Date(expirationTime),
    }
  }

  /**
   * Formatea una fecha en formato ISO para AFIP
   */
  private formatDate(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, '-03:00')
  }

  /**
   * Limpia el cache de autenticación
   */
  clearCache(): void {
    this.cachedAuth = undefined
  }
}
