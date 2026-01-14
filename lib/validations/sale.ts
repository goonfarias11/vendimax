import { z } from "zod";

// Transformador seguro anti-NaN
const safeNumberTransform = z.any()
  .transform(v => {
    const num = Number(v);
    return Number.isFinite(num) ? num : 0;
  })
  .refine(val => Number.isFinite(val), { message: "Must be a valid number" });

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
  quantity: safeNumberTransform.refine(v => v > 0, { message: "La cantidad debe ser positiva" }),
  unitPrice: safeNumberTransform.refine(v => v >= 0, { message: "El precio debe ser mayor o igual a 0" }),
  subtotal: safeNumberTransform.refine(v => v >= 0, { message: "El subtotal debe ser mayor o igual a 0" }),
});

export const salePaymentSchema = z.object({
  method: paymentMethodSchema,
  amount: safeNumberTransform.refine(v => v >= 0, { message: "El monto debe ser positivo" }),
  reference: z.string().optional().nullable(),
});

export const createSaleSchema = z.object({
  clientId: z.string().optional().nullable(),
  total: safeNumberTransform.refine(v => v >= 0, { message: "El total debe ser positivo" }),
  subtotal: safeNumberTransform.refine(v => v >= 0, { message: "El subtotal debe ser positivo" }),
  tax: safeNumberTransform,
  discount: safeNumberTransform,
  discountType: z.enum(["percentage", "fixed"]).optional().default("fixed"),
  paymentMethod: paymentMethodSchema,
  hasMixedPayment: z.boolean().default(false),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Debe incluir al menos un producto"),
  payments: z.array(salePaymentSchema).optional().nullable(),
});
