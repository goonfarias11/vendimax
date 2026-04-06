import { z } from "zod"

export const saleSchema = z.object({
  clientId: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional().nullable(),
        quantity: z.coerce.number().int().min(1),
        // Acepta tanto 'price' como 'unitPrice' (más flexible con frontend)
        price: z.coerce.number().positive().optional(),
        unitPrice: z.coerce.number().positive().optional(),
        subtotal: z.coerce.number().min(0).optional(),
        discount: z.coerce.number().min(0).optional().default(0),
      }).refine(
        (item) => item.price || item.unitPrice,
        { message: "Debe proporcionar 'price' o 'unitPrice'" }
      )
    )
    .min(1),
  paymentMethod: z.string().min(1),
  hasMixedPayment: z.boolean().optional(),
  payments: z.array(
    z.object({
      method: z.string(),
      amount: z.coerce.number().positive(),
      reference: z.string().optional().nullable(),
    })
  ).optional().nullable(),
  discount: z.coerce.number().min(0).optional().default(0),
  discountType: z.enum(["fixed", "percentage"]).optional().default("fixed"),
  total: z.coerce.number().min(0).optional(),
  subtotal: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional().default(0),
  status: z.string().optional(),
  notes: z.string().max(1000).optional().nullable(),
})
