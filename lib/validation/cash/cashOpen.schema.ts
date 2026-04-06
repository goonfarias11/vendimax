import { z } from "zod"

export const cashOpenSchema = z.object({
  openingAmount: z.number().min(0, "El monto inicial debe ser positivo"),
  notes: z.string().optional().nullable(),
})
