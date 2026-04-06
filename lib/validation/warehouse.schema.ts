import { z } from "zod"

export const warehouseSchema = z.object({
  name: z.string().min(1, "name requerido"),
  code: z.string().min(1, "code requerido").optional(),
  address: z.string().optional().nullable(),
  isMain: z.boolean().optional(),
  isActive: z.boolean().optional(),
  branchId: z.string().min(1, "branchId requerido"),
})

export const warehouseUpdateSchema = warehouseSchema.partial()

export type WarehouseInput = z.infer<typeof warehouseSchema>
