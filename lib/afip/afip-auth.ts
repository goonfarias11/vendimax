/**
 * AFIP WSAA - Autenticación
 * Web Service de Autenticación y Autorización
 */

import { readFileSync } from 'fs'
import { createSign } from 'crypto'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import type {
  AfipCredentials,
  AfipConfig,
  WSAALoginTicketResponse,
} from './types'

const WSAA_URLS = {
  production: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
  testing: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
}

let cachedCredentials: AfipCredentials | null = null

/**
 * Genera el XML LoginTicketRequest
 */
function generateLoginTicketRequest(config: AfipConfig, service: string = 'wsfe'): string {
  const now = new Date()
  const expirationTime = new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12 horas

  const uniqueId = Math.floor(now.getTime() / 1000)
  const generationTime = now.toISOString().slice(0, -5)
  const expiration = expirationTime.toISOString().slice(0, -5)

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${generationTime}</generationTime>
    <expirationTime>${expiration}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`
}

/**
 * Firma el LoginTicketRequest con el certificado privado
 */
function signLoginTicketRequest(xml: string, keyPath: string): string {
  try {
    const privateKey = readFileSync(keyPath, 'utf8')
    
    // Crear firma PKCS#7
    const signer = createSign('RSA-SHA256')
    signer.update(xml)
    signer.end()
    
    const signature = signer.sign(privateKey, 'base64')
    
    // Construir CMS (PKCS#7)
    const cms = `-----BEGIN PKCS7-----\n${signature}\n-----END PKCS7-----`
    
    return cms
  } catch (error) {
    console.error('Error firmando LoginTicketRequest:', error)
    throw new Error('Error al firmar el ticket de autenticación')
  }
}

/**
 * Llama al WSAA y obtiene Token + Sign
 */
async function callWSAA(cms: string, config: AfipConfig): Promise<WSAALoginTicketResponse> {
  const url = config.production ? WSAA_URLS.production : WSAA_URLS.testing

  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>${cms}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`

  try {
    const response = await axios.post(url, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '',
      },
      timeout: 30000,
    })

    // Parsear respuesta XML
    const parsed = await parseStringPromise(response.data, { explicitArray: false })
    
    const loginResponse = parsed['soapenv:Envelope']['soapenv:Body']['loginCmsResponse']['loginCmsReturn']
    const credentials = await parseStringPromise(loginResponse, { explicitArray: false })

    return {
      token: credentials.loginTicketResponse.credentials.token,
      sign: credentials.loginTicketResponse.credentials.sign,
      expirationTime: credentials.loginTicketResponse.header.expirationTime,
    }
  } catch (error: unknown) {
    const details = axios.isAxiosError(error)
      ? error.response?.data ?? error.message
      : error instanceof Error
        ? error.message
        : 'Error desconocido'
    console.error('Error llamando a WSAA:', details)
    throw new Error('Error obteniendo credenciales de AFIP')
  }
}

/**
 * Obtiene credenciales AFIP (Token + Sign)
 * Usa caché hasta que expiren
 */
export async function getAfipCredentials(config: AfipConfig): Promise<AfipCredentials> {
  // Verificar caché
  if (cachedCredentials && cachedCredentials.expirationTime > new Date()) {
    return cachedCredentials
  }

  if (!config.keyPath) {
    throw new Error('AFIP keyPath no configurado')
  }

  // Generar nuevo ticket
  const xml = generateLoginTicketRequest(config)
  const cms = signLoginTicketRequest(xml, config.keyPath)
  const response = await callWSAA(cms, config)

  // Cachear
  cachedCredentials = {
    token: response.token,
    sign: response.sign,
    expirationTime: new Date(response.expirationTime),
  }

  return cachedCredentials
}

/**
 * Invalida caché de credenciales (útil para testing)
 */
export function invalidateCredentialsCache(): void {
  cachedCredentials = null
}
