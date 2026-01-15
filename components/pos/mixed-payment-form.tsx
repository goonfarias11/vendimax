"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";

export interface Payment {
  method: string;
  amount: number;
  reference?: string;
}

interface MixedPaymentFormProps {
  total: number;
  onPaymentsChange: (payments: Payment[]) => void;
  onValidChange: (isValid: boolean) => void;
}

const paymentMethods = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA_DEBITO", label: "Débito" },
  { value: "TARJETA_CREDITO", label: "Crédito" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "QR", label: "QR/MercadoPago" },
  { value: "OTRO", label: "Otro" },
];

const safeNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export function MixedPaymentForm({ total, onPaymentsChange, onValidChange }: MixedPaymentFormProps) {
  const [payments, setPayments] = useState<Payment[]>([
    { method: "EFECTIVO", amount: 0, reference: "" }
  ]);

  useEffect(() => {
    const paymentsTotal = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
    const remaining = total - paymentsTotal;
    const isValid = Math.abs(remaining) < 0.01 && payments.every(p => safeNumber(p.amount) > 0);
    
    onPaymentsChange(payments);
    onValidChange(isValid);
  }, [payments, total, onPaymentsChange, onValidChange]);

  const addPayment = () => {
    if (payments.length < 2) {
      setPayments([...payments, { method: "EFECTIVO", amount: 0, reference: "" }]);
    }
  };

  const removePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const updatePayment = (index: number, field: keyof Payment, value: any) => {
    const newPayments = [...payments];
    if (field === "amount") {
      newPayments[index][field] = safeNumber(value);
    } else {
      (newPayments[index] as any)[field] = value;
    }
    setPayments(newPayments);
  };

  const paymentsTotal = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
  const remaining = total - paymentsTotal;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Medios de Pago</Label>
        {payments.length < 2 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPayment}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar medio
          </Button>
        )}
      </div>

      {payments.map((payment, index) => (
        <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-gray-50">
          <div className="flex-1 space-y-2">
            <div>
              <Label htmlFor={`method-${index}`} className="text-xs">
                Método {index + 1}
              </Label>
              <Select
                value={payment.method}
                onValueChange={(value) => updatePayment(index, "method", value)}
              >
                <SelectTrigger id={`method-${index}`} className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={`amount-${index}`} className="text-xs">
                Monto
              </Label>
              <Input
                id={`amount-${index}`}
                type="number"
                step="0.01"
                min="0"
                value={payment.amount || ""}
                onChange={(e) => updatePayment(index, "amount", e.target.value)}
                className="h-9"
                placeholder="0.00"
              />
            </div>

            {(payment.method === "TRANSFERENCIA" || payment.method === "QR") && (
              <div>
                <Label htmlFor={`reference-${index}`} className="text-xs">
                  Referencia (opcional)
                </Label>
                <Input
                  id={`reference-${index}`}
                  type="text"
                  value={payment.reference || ""}
                  onChange={(e) => updatePayment(index, "reference", e.target.value)}
                  className="h-9"
                  placeholder="Nº de operación"
                />
              </div>
            )}
          </div>

          {payments.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removePayment(index)}
              className="mt-6 h-9 w-9 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {/* Summary */}
      <div className="border-t pt-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total a pagar:</span>
          <span className="font-semibold">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total pagado:</span>
          <span className={paymentsTotal > 0 ? "font-medium" : "text-gray-400"}>
            ${paymentsTotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-base font-bold">
          <span>Restante:</span>
          <span className={remaining === 0 ? "text-green-600" : remaining < 0 ? "text-red-600" : "text-orange-600"}>
            ${remaining.toFixed(2)}
          </span>
        </div>
      </div>

      {remaining !== 0 && (
        <div className="text-xs text-center text-amber-700 bg-amber-50 p-2 rounded">
          {remaining > 0
            ? `Falta pagar $${remaining.toFixed(2)}`
            : `Sobran $${Math.abs(remaining).toFixed(2)}`}
        </div>
      )}
    </div>
  );
}
