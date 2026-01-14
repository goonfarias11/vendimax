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
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().positive("La cantidad debe ser positiva").transform(v => Number(v) || 1),
  unitPrice: z.coerce.number().positive("El precio debe ser positivo").transform(v => Number(v) || 0),
  subtotal: z.coerce.number().positive("El subtotal debe ser positivo").transform(v => Number(v) || 0),
});

export const salePaymentSchema = z.object({
  method: paymentMethodSchema,
  amount: z.number().positive("El monto debe ser positivo"),
  reference: z.string().optional().nullable(),
});

export const createSaleSchema = z.object({
  clientId: z.string().optional().nullable(),
  total: z.coerce.number().positive("El total debe ser positivo").transform(v => Number(v) || 0),
  subtotal: z.coerce.number().positive("El subtotal debe ser positivo").transform(v => Number(v) || 0),
  tax: z.coerce.number().min(0).default(0).transform(v => Number(v) || 0),
  discount: z.coerce.number().min(0).default(0).transform(v => Number(v) || 0),
  discountType: z.enum(["percentage", "fixed"]).optional().default("fixed"),
  paymentMethod: paymentMethodSchema,
  hasMixedPayment: z.boolean().default(false),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Debe incluir al menos un producto"),
  payments: z.array(salePaymentSchema).optional().nullable(),
});
