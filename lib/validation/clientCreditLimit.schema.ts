import { z } from "zod"

export const clientCreditLimitSchema = z.object({
  creditLimit: z.number().nonnegative("Límite de crédito inválido"),
})

export type ClientCreditLimitInput = z.infer<typeof clientCreditLimitSchema>
