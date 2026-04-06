import { z } from "zod"

export const cashCloseSchema = z.object({
  cashRegisterId: z.string().min(1),
  closingAmount: z.number().min(0, "El monto final debe ser positivo"),
  notes: z.string().optional().nullable(),
})
