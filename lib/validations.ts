import { z } from "zod"

// ============================================
// VENTAS
// ============================================

export const createSaleSchema = z.object({
  clientId: z.string().cuid("ID de cliente inválido"),
  paymentMethod: z.enum([
    "EFECTIVO", 
    "TARJETA_DEBITO", 
    "TARJETA_CREDITO", 
    "TRANSFERENCIA", 
    "QR", 
    "OTRO"
  ]),
  items: z.array(
    z.object({
      productId: z.string().cuid("ID de producto inválido"),
      quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0"),
      price: z.coerce.number().positive("El precio debe ser mayor a 0")
    })
  ).min(1, "Debe haber al menos un producto en la venta")
})

export type CreateSaleInput = z.infer<typeof createSaleSchema>

// ============================================
// CLIENTES
// ============================================

export const createClientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().min(8, "El teléfono debe tener al menos 8 dígitos").optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  taxId: z.string().optional().nullable()
})

export type CreateClientInput = z.infer<typeof createClientSchema>

export const updateClientSchema = createClientSchema.partial()

// ============================================
// PRODUCTOS
// ============================================

export const createProductSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres"),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  cost: z.coerce.number().positive("El costo debe ser mayor a 0"),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  minStock: z.coerce.number().int().min(0, "El stock mínimo no puede ser negativo"),
  categoryId: z.string().cuid("ID de categoría inválido"),
  isActive: z.boolean().optional()
})

export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateProductSchema = createProductSchema.partial()

// ============================================
// USUARIOS
// ============================================

export const registerUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["ADMIN", "VENDEDOR", "CAJERO", "GERENTE"]).optional()
})

export type RegisterUserInput = z.infer<typeof registerUserSchema>

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida")
})

// ============================================
// PROVEEDORES
// ============================================

export const createSupplierSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().min(8).optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  contactName: z.string().optional().nullable()
})

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>

// ============================================
// CATEGORÍAS
// ============================================

export const createCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional().nullable()
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

// ============================================
// CIERRE DE CAJA
// ============================================

export const closeCashRegisterSchema = z.object({
  notes: z.string().max(500, "Las observaciones no pueden exceder 500 caracteres").optional().nullable(),
  // Campos opcionales para ajustes manuales (normalmente se calculan automáticamente)
  manualTotalCash: z.coerce.number().nonnegative("El total en efectivo no puede ser negativo").optional(),
  manualTotalCard: z.coerce.number().nonnegative("El total en tarjeta no puede ser negativo").optional(),
  manualTotalTransfer: z.coerce.number().nonnegative("El total en transferencia no puede ser negativo").optional(),
})

export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>

// Schema para validar el rango de fechas del cierre
export const cashClosingRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
}).refine((data) => data.to > data.from, {
  message: "La fecha final debe ser posterior a la fecha inicial",
})

export type CashClosingRange = z.infer<typeof cashClosingRangeSchema>

// ============================================
// UTILIDADES DE VALIDACIÓN
// ============================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: any } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }

  const firstError = result.error.issues[0]
  return {
    success: false,
    error: firstError.message,
    details: result.error.issues.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message
    }))
  }
}
