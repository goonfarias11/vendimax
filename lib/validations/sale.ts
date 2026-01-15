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
  documentType: z.enum(["ticket", "invoice"]).optional().default("ticket"),
}).refine(
  (data) => {
    // Si tiene pagos mixtos, validar la suma
    if (data.hasMixedPayment && data.payments && data.payments.length > 0) {
      // Validar que tenga entre 1 y 2 pagos
      if (data.payments.length > 2) {
        return false;
      }
      // Validar que la suma de pagos sea igual al total (con tolerancia de centavos)
      const paymentsTotal = data.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const diff = Math.abs(paymentsTotal - (Number(data.total) || 0));
      return diff < 0.01; // Tolerancia de 1 centavo
    }
    return true;
  },
  {
    message: "La suma de los pagos debe ser igual al total de la venta",
    path: ["payments"],
  }
);
