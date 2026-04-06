import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  sku: z.string().min(3).max(64),
  barcode: z.string().max(64).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  price: z.coerce.number().positive(),
  cost: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0).optional(),
  minStock: z.coerce.number().int().min(0),
  maxStock: z.coerce.number().int().min(0).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
  unit: z.string().max(32).optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).default(21),
})
