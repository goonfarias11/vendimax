import { z } from "zod"

export const clientPaymentSchema = z.object({
  amount: z.number().positive("Monto inválido"),
  paymentMethod: z.string().min(1, "Método de pago requerido"),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type ClientPaymentInput = z.infer<typeof clientPaymentSchema>
