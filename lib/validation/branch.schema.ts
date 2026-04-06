import { z } from "zod"

export const branchSchema = z.object({
  name: z.string().min(1, "name requerido"),
  code: z.string().min(1, "code requerido"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isMain: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export const branchUpdateSchema = branchSchema.partial()

export type BranchInput = z.infer<typeof branchSchema>
