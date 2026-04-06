import { z } from "zod"

export const clientSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string()).optional(),
  creditLimit: z.coerce.number().min(0).default(0),
  hasCreditAccount: z.boolean().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(["ACTIVE", "DELINQUENT", "INACTIVE", "BLOCKED"]).optional(),
})
