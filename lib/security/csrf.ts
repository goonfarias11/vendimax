// lib/security/csrf.ts - CSRF Protection para formularios

import { randomBytes } from 'crypto'

const tokens = new Map<string, { token: string; expires: number }>()

/**
 * Genera un token CSRF único
 */
export function generateCSRFToken(sessionId: string): string {
  const token = randomBytes(32).toString('hex')
  const expires = Date.now() + 3600000 // 1 hora
  
  tokens.set(sessionId, { token, expires })
  
  // Limpiar tokens expirados cada 10 tokens
  if (tokens.size % 10 === 0) {
    cleanExpiredTokens()
  }
  
  return token
}

/**
 * Valida un token CSRF
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const record = tokens.get(sessionId)
  
  if (!record) return false
  if (Date.now() > record.expires) {
    tokens.delete(sessionId)
    return false
  }
  if (record.token !== token) return false
  
  // Token válido - eliminarlo para que sea de un solo uso
  tokens.delete(sessionId)
  return true
}

/**
 * Limpia tokens expirados
 */
function cleanExpiredTokens() {
  const now = Date.now()
  for (const [key, value] of tokens.entries()) {
    if (now > value.expires) {
      tokens.delete(key)
    }
  }
}

/**
 * Middleware helper para verificar CSRF en APIs
 */
export function csrfMiddleware(headers: Headers, sessionId?: string): boolean {
  if (!sessionId) return false
  
  const token = headers.get('X-CSRF-Token')
  if (!token) return false
  
  return validateCSRFToken(sessionId, token)
}
