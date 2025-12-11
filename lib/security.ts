/**
 * Utilidades de seguridad para VendiMax
 * Incluye sanitización, validación y protección contra ataques comunes
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitiza HTML para prevenir XSS
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

/**
 * Sanitiza texto plano removiendo caracteres peligrosos
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript: protocol
    .replace(/on\w+=/gi, '') // Remover event handlers
    .trim();
}

/**
 * Valida y sanitiza email
 */
export function sanitizeEmail(email: string): string {
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Email inválido');
  }
  
  return sanitized;
}

/**
 * Valida y sanitiza número de teléfono
 */
export function sanitizePhone(phone: string): string {
  // Remover todo excepto números, +, -, (, ), espacios
  const sanitized = phone.replace(/[^0-9+\-() ]/g, '').trim();
  
  if (sanitized.length < 8) {
    throw new Error('Teléfono inválido');
  }
  
  return sanitized;
}

/**
 * Previene SQL Injection escapando caracteres especiales
 * Nota: Prisma ya maneja esto, pero es una capa extra
 */
export function escapeSql(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/**
 * Valida que un string solo contenga caracteres alfanuméricos y guiones
 */
export function isAlphanumericDash(str: string): boolean {
  return /^[a-zA-Z0-9-_]+$/.test(str);
}

/**
 * Valida CUIT/CUIL argentino
 */
export function validateCuit(cuit: string): boolean {
  const cleanCuit = cuit.replace(/[-\s]/g, '');
  
  if (cleanCuit.length !== 11) return false;
  if (!/^\d+$/.test(cleanCuit)) return false;

  const [checkDigit, ...rest] = cleanCuit.split('').reverse().map(Number);
  const total = rest.reduce(
    (acc, cur, idx) => acc + cur * [2, 3, 4, 5, 6, 7][idx % 6],
    0
  );
  
  const calculatedCheckDigit = (11 - (total % 11)) % 11;
  return checkDigit === calculatedCheckDigit;
}

/**
 * Sanitiza objeto completo recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    allowHtml?: boolean;
    allowEmail?: boolean;
  } = {}
): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      if (options.allowHtml && key.includes('description')) {
        sanitized[key] = sanitizeHtml(value);
      } else if (options.allowEmail && key === 'email') {
        try {
          sanitized[key] = sanitizeEmail(value);
        } catch {
          sanitized[key] = value;
        }
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, options);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' ? sanitizeObject(item, options) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Detecta patrones de inyección SQL
 */
export function detectSqlInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION.*SELECT)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Genera token CSRF
 */
export function generateCsrfToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Valida que un valor sea un número positivo
 */
export function validatePositiveNumber(value: any, fieldName: string): number {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new Error(`${fieldName} debe ser un número`);
  }
  
  if (num < 0) {
    throw new Error(`${fieldName} no puede ser negativo`);
  }
  
  return num;
}

/**
 * Valida que un valor sea un entero positivo
 */
export function validatePositiveInteger(value: any, fieldName: string): number {
  const num = validatePositiveNumber(value, fieldName);
  
  if (!Number.isInteger(num)) {
    throw new Error(`${fieldName} debe ser un número entero`);
  }
  
  return num;
}

/**
 * Limita la longitud de un string
 */
export function limitString(str: string, maxLength: number): string {
  return str.length > maxLength ? str.substring(0, maxLength) : str;
}

/**
 * Valida formato de SKU
 */
export function validateSku(sku: string): boolean {
  // SKU debe tener entre 3 y 50 caracteres alfanuméricos y guiones
  return /^[A-Z0-9-]{3,50}$/i.test(sku);
}

/**
 * Valida formato de código de barras
 */
export function validateBarcode(barcode: string): boolean {
  // Códigos de barras comunes: EAN-13, UPC-A, etc.
  return /^\d{8,13}$/.test(barcode);
}

/**
 * Headers de seguridad recomendados
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:",
} as const;
