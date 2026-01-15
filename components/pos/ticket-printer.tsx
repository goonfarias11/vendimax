"use client";

import { forwardRef } from "react";

interface TicketData {
  id: string;
  ticketNumber: number;
  createdAt: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  client?: {
    name: string;
  };
  items: Array<{
    quantity: number;
    product: {
      name: string;
    };
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  payments?: Array<{
    method: string;
    amount: number;
  }>;
  hasMixedPayment?: boolean;
}

interface TicketPrinterProps {
  sale: TicketData;
  type?: "ticket" | "invoice";
}

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const paymentMethodLabels: { [key: string]: string } = {
  'EFECTIVO': 'Efectivo',
  'TARJETA_DEBITO': 'Débito',
  'TARJETA_CREDITO': 'Crédito',
  'TRANSFERENCIA': 'Transferencia',
  'QR': 'QR/MercadoPago',
  'CUENTA_CORRIENTE': 'Cuenta Corriente',
  'MIXTO': 'Mixto',
  'OTRO': 'Otro'
};

export const TicketPrinter = forwardRef<HTMLDivElement, TicketPrinterProps>(
  ({ sale, type = "ticket" }, ref) => {
    return (
      <div ref={ref} className="hidden print:block">
        <div className="ticket-container">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold">{sale.businessName || "VENDIMAX"}</h1>
            {sale.businessAddress && (
              <p className="text-xs">{sale.businessAddress}</p>
            )}
            {sale.businessPhone && (
              <p className="text-xs">Tel: {sale.businessPhone}</p>
            )}
          </div>

          <div className="border-t border-b border-dashed border-gray-400 py-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>{type === "invoice" ? "FACTURA" : "TICKET"} #{sale.ticketNumber}</span>
              <span>{formatDate(sale.createdAt)}</span>
            </div>
            {sale.client && (
              <div className="text-sm mt-1">
                Cliente: {sale.client.name}
              </div>
            )}
          </div>

          {/* Items */}
          <table className="w-full mb-4 text-sm">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left py-1">Cant</th>
                <th className="text-left py-1">Descripción</th>
                <th className="text-right py-1">P.Unit</th>
                <th className="text-right py-1">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index} className="border-b border-dotted border-gray-300">
                  <td className="py-1">{item.quantity}</td>
                  <td className="py-1">{item.product.name}</td>
                  <td className="text-right py-1">{formatCurrency(item.price)}</td>
                  <td className="text-right py-1">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-dashed border-gray-400 pt-2 mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span>Descuento:</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base mt-2">
              <span>TOTAL:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t border-dashed border-gray-400 pt-2 mb-4">
            <div className="text-sm font-semibold mb-1">Forma de Pago:</div>
            {sale.hasMixedPayment && sale.payments && sale.payments.length > 0 ? (
              <>
                {sale.payments.map((payment, index) => (
                  <div key={index} className="flex justify-between text-sm mb-1">
                    <span>{paymentMethodLabels[payment.method] || payment.method}:</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-sm">
                {paymentMethodLabels[sale.paymentMethod || 'EFECTIVO'] || 'Efectivo'}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs mt-6 border-t border-dashed border-gray-400 pt-4">
            <p>¡Gracias por su compra!</p>
            <p className="mt-1">ID: {sale.id}</p>
          </div>
        </div>

        <style jsx>{`
          @media print {
            .ticket-container {
              width: 80mm;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              padding: 10mm;
              margin: 0 auto;
            }
            
            @page {
              size: 80mm auto;
              margin: 0;
            }
            
            body {
              margin: 0;
              padding: 0;
            }
          }
        `}</style>
      </div>
    );
  }
);

TicketPrinter.displayName = "TicketPrinter";
