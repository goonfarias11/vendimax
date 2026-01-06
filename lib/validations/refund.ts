import { z } from "zod";

export const refundItemSchema = z.object({
  saleItemId: z.string().min(1, "Sale item ID es requerido"),
  productId: z.string().min(1, "Product ID es requerido"),
  quantity: z.number().int().positive("La cantidad debe ser positiva"),
  price: z.number().positive("El precio debe ser positivo"),
  subtotal: z.number().positive("El subtotal debe ser positivo"),
});

export const createRefundSchema = z.object({
  saleId: z.string().min(1, "ID de venta es requerido"),
  type: z.enum(["TOTAL", "PARCIAL"]),
  reason: z.string().min(10, "El motivo debe tener al menos 10 caracteres"),
  items: z.array(refundItemSchema).min(1, "Debe incluir al menos un producto"),
  refundAmount: z.number().positive("El monto a devolver debe ser positivo"),
  restockItems: z.boolean().default(true), // Si devolver productos al stock
  notes: z.string().optional(),
});

export type RefundItemInput = z.infer<typeof refundItemSchema>;
export type CreateRefundInput = z.infer<typeof createRefundSchema>;
