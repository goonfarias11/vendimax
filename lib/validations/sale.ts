import { z } from "zod";

export const paymentMethodSchema = z.enum([
  "EFECTIVO",
  "TARJETA_DEBITO",
  "TARJETA_CREDITO",
  "TRANSFERENCIA",
  "QR",
  "CUENTA_CORRIENTE",
  "MIXTO",
  "OTRO",
]);

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID es requerido"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  price: z.number().positive("El precio debe ser positivo"),
  subtotal: z.number().positive("El subtotal debe ser positivo"),
});

export const salePaymentSchema = z.object({
  paymentMethod: paymentMethodSchema,
  amount: z.number().positive("El monto debe ser positivo"),
  reference: z.string().optional(),
});

export const createSaleSchema = z.object({
  clientId: z.string().optional(),
  total: z.number().positive("El total debe ser positivo"),
  subtotal: z.number().positive("El subtotal debe ser positivo"),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  paymentMethod: paymentMethodSchema,
  hasMixedPayment: z.boolean().default(false),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Debe incluir al menos un producto"),
  payments: z.array(salePaymentSchema).optional(),
});
