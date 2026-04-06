import { z } from "zod"

export const cashRegisterSchema = z.object({
  cashRegisterId: z.string().min(1),
  amount: z.number().min(0),
  type: z.enum(["INGRESO", "EGRESO", "VENTA", "SALIDA", "APERTURA", "CIERRE"]).optional(),
  description: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})
