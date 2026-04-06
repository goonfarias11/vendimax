"use client";

import jsPDF from "jspdf";
import type { TicketData } from "@/components/ticket/ticket-template";

type PrintOptions = {
  widthMm?: 58 | 80;
  title?: string;
};

const money = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const paymentLabel = (method: string) => {
  const labels: Record<string, string> = {
    EFECTIVO: "Efectivo",
    TARJETA_DEBITO: "Tarjeta Debito",
    TARJETA_CREDITO: "Tarjeta Credito",
    TRANSFERENCIA: "Transferencia",
    MIXTO: "Mixto",
    QR: "QR",
    CUENTA_CORRIENTE: "Cuenta Corriente",
  };

  return labels[method] || method;
};

/**
 * PrintService
 * - printHtml: imprime contenido HTML en una ventana/iframe controlada
 * - downloadPdf: genera PDF (tamaño ticket) sin impresora física
 */
export const PrintService = {
  printHtml(html: string, options: PrintOptions = {}) {
    if (typeof window === "undefined") return;
    const { widthMm = 80, title = "Ticket" } = options;
    const printWindow = window.open("", "_blank", `width=${widthMm * 4},height=800`);
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: ${widthMm}mm auto; margin: 0; }
            body { margin: 0; display: flex; justify-content: center; }
          </style>
        </head>
        <body>
          ${html}
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  },

  downloadTicketPdf(ticket: TicketData, options: PrintOptions = {}) {
    if (typeof window === "undefined") return;
    const { widthMm = 80, title = "ticket" } = options;

    const widthPt = widthMm * 2.83465;
    const marginX = 10;
    const lineH = 11;

    const estimatedLines =
      16 +
      ticket.items.length * 3 +
      (ticket.discount ? 1 : 0) +
      (typeof ticket.tax === "number" ? 1 : 0);

    const pageHeightPt = Math.max(420, estimatedLines * lineH + 40);

    const doc = new jsPDF({
      unit: "pt",
      format: [widthPt, pageHeightPt],
    });

    const contentWidth = widthPt - marginX * 2;
    const writeLeft = (text: string, y: number, bold = false) => {
      doc.setFont("courier", bold ? "bold" : "normal");
      doc.text(text, marginX, y);
    };
    const writeRight = (text: string, y: number, bold = false) => {
      doc.setFont("courier", bold ? "bold" : "normal");
      const textWidth = doc.getTextWidth(text);
      doc.text(text, marginX + contentWidth - textWidth, y);
    };
    const writeCenter = (text: string, y: number, bold = false) => {
      doc.setFont("courier", bold ? "bold" : "normal");
      const textWidth = doc.getTextWidth(text);
      doc.text(text, marginX + (contentWidth - textWidth) / 2, y);
    };
    const divider = (y: number) => {
      doc.line(marginX, y, marginX + contentWidth, y);
    };

    let y = 18;

    writeCenter(ticket.business.name || "VendiMax", y, true);
    y += lineH;
    if (ticket.business.taxId) {
      writeCenter(`CUIT: ${ticket.business.taxId}`, y);
      y += lineH;
    }
    if (ticket.business.address) {
      writeCenter(ticket.business.address, y);
      y += lineH;
    }
    if (ticket.business.phone) {
      writeCenter(`Tel: ${ticket.business.phone}`, y);
      y += lineH;
    }

    y += 2;
    divider(y);
    y += lineH;

    writeLeft("Ticket:", y);
    writeRight(String(ticket.ticketNumber), y);
    y += lineH;
    writeLeft("Fecha:", y);
    writeRight(new Date(ticket.createdAt).toLocaleString("es-AR"), y);
    y += lineH;
    writeLeft("Cajero:", y);
    writeRight(ticket.cashier || "Usuario", y);
    y += lineH;
    writeLeft("Cliente:", y);
    writeRight(ticket.client || "Consumidor final", y);
    y += lineH;

    divider(y);
    y += lineH;
    writeLeft("PRODUCTOS", y, true);
    y += lineH;
    divider(y);
    y += lineH;

    ticket.items.forEach((item) => {
      const itemName = item.name || "Producto";
      writeLeft(itemName, y, true);
      y += lineH;
      writeLeft(`${item.quantity} x ${money(item.unitPrice)}`, y);
      writeRight(money(item.subtotal), y);
      y += lineH;
    });

    divider(y);
    y += lineH;
    writeLeft("Subtotal", y);
    writeRight(money(ticket.subtotal), y);
    y += lineH;

    if (ticket.discount) {
      writeLeft("Descuento", y);
      writeRight(`-${money(ticket.discount)}`, y);
      y += lineH;
    }

    if (typeof ticket.tax === "number") {
      writeLeft("Impuestos", y);
      writeRight(money(ticket.tax), y);
      y += lineH;
    }

    divider(y);
    y += lineH;
    writeLeft("TOTAL", y, true);
    writeRight(money(ticket.total), y, true);
    y += lineH;
    writeLeft("Pago", y);
    writeRight(paymentLabel(ticket.paymentMethod), y);
    y += lineH;

    divider(y);
    y += lineH;
    writeCenter("Gracias por su compra", y);

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  async downloadElementPdf(element: HTMLElement, options: PrintOptions = {}) {
    if (typeof window === "undefined") return;
    const { widthMm = 80, title = "ticket" } = options;

    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const widthPt = widthMm * 2.83465;
    const margin = 10;
    const printableWidth = widthPt - margin * 2;
    const imageHeight = (canvas.height * printableWidth) / canvas.width;

    const doc = new jsPDF({
      unit: "pt",
      format: [widthPt, imageHeight + margin * 2],
    });

    doc.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      margin,
      margin,
      printableWidth,
      imageHeight,
      undefined,
      "FAST",
    );

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  async downloadPdf(html: string, options: PrintOptions = {}) {
    if (typeof window === "undefined") return;
    const { widthMm = 80, title = "ticket" } = options;

    // jsPDF toma puntos; 1mm ≈ 2.83465pt
    const widthPt = widthMm * 2.83465;
    const doc = new jsPDF({
      unit: "pt",
      format: [widthPt, 1000], // altura auto-ajustada al final
    });

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-10000px";
    wrapper.style.top = "0";
    wrapper.style.width = `${widthMm}mm`;
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    try {
      await doc.html(wrapper, {
        margin: 10,
        autoPaging: "text",
        html2canvas: {
          scale: 1,
          useCORS: true,
        },
      });

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      wrapper.remove();
    }
  },
};
