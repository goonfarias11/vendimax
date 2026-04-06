import { z } from "zod"

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product ID es requerido"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  cost: z.number().nonnegative("El costo no puede ser negativo"),
  subtotal: z.number().nonnegative("El subtotal no puede ser negativo"),
})

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Proveedor es requerido"),
  items: z.array(purchaseItemSchema).min(1, "Debe incluir al menos un producto"),
  subtotal: z.number().nonnegative("El subtotal no puede ser negativo"),
  tax: z.number().nonnegative("El impuesto no puede ser negativo").default(0),
  total: z.number().nonnegative("El total no puede ser negativo"),
  invoiceNum: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type PurchaseInput = z.infer<typeof purchaseSchema>
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>
