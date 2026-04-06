import { z } from "zod"

export const supplierSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
})
