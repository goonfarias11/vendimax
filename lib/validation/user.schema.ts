import { z } from "zod"

export const createUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["OWNER", "ADMIN", "GERENTE", "SUPERVISOR", "VENDEDOR"]),
})

export const updateUserSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "GERENTE", "SUPERVISOR", "VENDEDOR"]).optional(),
  isActive: z.boolean().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
