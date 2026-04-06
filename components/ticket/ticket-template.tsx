 "use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export type TicketLineItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type TicketData = {
  ticketNumber: string | number;
  createdAt: string;
  business: {
    name: string;
    logo?: string | null;
    taxId?: string | null;
    address?: string | null;
    phone?: string | null;
  };
  cashier: string;
  client?: string | null;
  paymentMethod: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  items: TicketLineItem[];
};

type Props = {
  data: TicketData;
  widthMm?: 58 | 80;
  className?: string;
};

const money = (n: number | undefined) =>
  `\$${Number(n || 0).toFixed(2)}`;

/**
 * TicketComponent
 * Renderiza un ticket térmico (58mm/80mm) listo para preview, impresión o PDF.
 */
export function TicketTemplate({ data, widthMm = 80, className }: Props) {
  return (
    <div
      className={cn(
        "ticket-paper bg-white text-black",
        className
      )}
      style={{
        width: `${widthMm}mm`,
        maxWidth: `${widthMm}mm`,
        padding: "6mm 4mm",
        fontFamily: "'Courier New', monospace",
        fontSize: "11px",
      }}
    >
      <style jsx global>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .ticket-paper { box-shadow: none !important; }
        }
        .ticket-divider {
          border-bottom: 1px dashed #000;
          margin: 6px 0;
        }
      `}</style>

      <div className="text-center mb-2">
        {data.business.logo ? (
          <div className="flex justify-center mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.business.logo}
              alt="Logo"
              style={{ maxHeight: 48, maxWidth: "60%" }}
            />
          </div>
        ) : null}
        <div className="font-bold text-sm">{data.business.name}</div>
        {data.business.taxId && (
          <div>CUIT: {data.business.taxId}</div>
        )}
        {data.business.address && <div>{data.business.address}</div>}
        {data.business.phone && <div>Tel: {data.business.phone}</div>}
      </div>

      <div className="ticket-divider" />
      <div className="flex justify-between">
        <span>Ticket:</span>
        <span>{data.ticketNumber}</span>
      </div>
      <div className="flex justify-between">
        <span>Fecha:</span>
        <span>
          {new Date(data.createdAt).toLocaleString("es-AR")}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Cajero:</span>
        <span>{data.cashier}</span>
      </div>
      <div className="flex justify-between">
        <span>Cliente:</span>
        <span>{data.client || "Consumidor final"}</span>
      </div>

      <div className="ticket-divider" />
      <div className="font-bold mb-1">PRODUCTOS</div>
      <div className="ticket-divider" />

      <div className="space-y-1">
        {data.items.map((item) => (
          <div key={item.id}>
            <div className="font-bold">{item.name}</div>
            <div className="flex justify-between">
              <span>
                {item.quantity} x {money(item.unitPrice)}
              </span>
              <span>{money(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ticket-divider" />
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{money(data.subtotal)}</span>
      </div>
      {data.discount ? (
        <div className="flex justify-between">
          <span>Descuento</span>
          <span>-{money(data.discount)}</span>
        </div>
      ) : null}
      {typeof data.tax === "number" ? (
        <div className="flex justify-between">
          <span>Impuestos</span>
          <span>{money(data.tax)}</span>
        </div>
      ) : null}
      <div className="ticket-divider" />
      <div className="flex justify-between font-bold text-sm">
        <span>TOTAL</span>
        <span>{money(data.total)}</span>
      </div>
      <div className="flex justify-between mt-1">
        <span>Pago</span>
        <span>{data.paymentMethod}</span>
      </div>

      <div className="ticket-divider" />
      <div className="text-center text-[10px]">
        ¡Gracias por su compra!
      </div>
    </div>
  );
}

export default TicketTemplate;
