import { z } from "zod"

export const clientCreditSchema = z.object({
  creditLimit: z.number().nonnegative().optional(),
  payment: z.number().nonnegative().optional(),
})

export type ClientCreditInput = z.infer<typeof clientCreditSchema>
