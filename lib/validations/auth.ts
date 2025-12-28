import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  businessName: z.string().min(2, "El nombre del negocio es requerido").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const businessOnboardingSchema = z.object({
  name: z.string().min(2, "El nombre del negocio debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});
