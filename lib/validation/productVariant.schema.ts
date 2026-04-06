import { z } from "zod"

export const productVariantSchema = z.object({
  productId: z.string().min(1, "productId es requerido"),
  name: z.string().min(1, "name es requerido"),
  attributes: z.record(z.string(), z.any()).optional(),
  sku: z.string().trim().min(1),
  barcode: z.string().trim().min(1).optional().nullable(),
  stock: z.number().int().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
})

export const productVariantUpdateSchema = productVariantSchema.partial().extend({
  productId: z.string().min(1, "productId es requerido").optional(),
})

export type ProductVariantInput = z.infer<typeof productVariantSchema>
export type ProductVariantUpdateInput = z.infer<typeof productVariantUpdateSchema>
