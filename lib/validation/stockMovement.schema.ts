import { z } from "zod"

export const stockMovementSchema = z.object({
  productId: z.string().min(1, "productId es requerido"),
  variantId: z.string().min(1).optional(),
  type: z.enum(["ENTRADA", "SALIDA", "AJUSTE", "TRANSFERENCIA"]),
  quantity: z.number().nonnegative("quantity no puede ser negativo"),
  reason: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
})

export type StockMovementInput = z.infer<typeof stockMovementSchema>
