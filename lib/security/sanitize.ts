// lib/security/sanitize.ts - Sanitización de inputs para prevenir XSS e inyecciones

/**
 * Sanitiza un string removiendo caracteres peligrosos
 */
export function sanitizeString(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers
    .trim()
}

/**
 * Sanitiza un email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w\s@\.\-\+]/gi, '')
}

/**
 * Sanitiza un número de teléfono
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ''
  
  return phone
    .replace(/[^\d\+\-\(\)\s]/g, '')
    .trim()
}

/**
 * Sanitiza un SKU o código de barras
 */
export function sanitizeCode(code: string): string {
  if (!code) return ''
  
  return code
    .replace(/[^\w\-]/g, '')
    .toUpperCase()
    .trim()
}

/**
 * Sanitiza HTML permitiendo solo tags seguros
 */
export function sanitizeHTML(html: string): string {
  if (!html) return ''
  
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
  const allowedAttributes = ['href', 'title']
  
  // Simple sanitization - en producción usar librería como DOMPurify
  let sanitized = html
  
  // Remover todos los tags excepto los permitidos
  sanitized = sanitized.replace(/<(\w+)[^>]*>/gi, (match, tag) => {
    return allowedTags.includes(tag.toLowerCase()) ? match : ''
  })
  
  return sanitized
}

/**
 * Valida y sanitiza un CUIT/CUIL argentino
 */
export function sanitizeTaxId(taxId: string): string {
  if (!taxId) return ''
  
  // Remover todo excepto números y guiones
  return taxId
    .replace(/[^\d\-]/g, '')
    .trim()
}

/**
 * Previene SQL injection básico removiendo caracteres peligrosos
 * NOTA: Prisma ya previene SQL injection, esto es una capa extra
 */
export function sanitizeForDB(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .trim()
}

/**
 * Valida que un ID sea válido (cuid o uuid)
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  
  // cuid pattern (25 chars, alphanumeric)
  const cuidPattern = /^c[a-z0-9]{24}$/
  
  // uuid v4 pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  return cuidPattern.test(id) || uuidPattern.test(id)
}

/**
 * Sanitiza un objeto completo recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizeObject(item) : sanitizeString(String(item))
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized as T
}

/**
 * Rate limiting helper - verifica frecuencia de requests
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = requestCounts.get(identifier)
  
  if (!record || now > record.resetTime) {
    // Nueva ventana de tiempo
    const resetTime = now + windowMs
    requestCounts.set(identifier, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }
  
  record.count++
  
  if (record.count > maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}
