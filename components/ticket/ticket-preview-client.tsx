"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download, ChevronDown, ChevronUp } from "lucide-react";
import { TicketTemplate, TicketData } from "./ticket-template";
import { PrintService } from "@/lib/print/print-service";

type Props = {
  ticket: TicketData;
};

const WIDTHS: Array<{ label: string; value: 58 | 80 }> = [
  { label: "58mm", value: 58 },
  { label: "80mm", value: 80 },
];

export function TicketPreviewClient({ ticket }: Props) {
  const [width, setWidth] = useState<58 | 80>(80);
  const [showPreview, setShowPreview] = useState(true);

  const handlePrint = () => {
    const container = document.getElementById("ticket-print-root");
    if (!container) return;
    PrintService.printHtml(container.innerHTML, { widthMm: width, title: `ticket-${ticket.ticketNumber}` });
  };

  const handleDownload = async () => {
    const title = `ticket-${ticket.ticketNumber}`;
    const container = document.getElementById("ticket-print-root");

    if (!container) {
      PrintService.downloadTicketPdf(ticket, { widthMm: width, title });
      return;
    }

    try {
      await PrintService.downloadElementPdf(container, { widthMm: width, title });
    } catch {
      // Fallback estable si el navegador bloquea render de canvas.
      PrintService.downloadTicketPdf(ticket, { widthMm: width, title });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">Ancho</span>
          <div className="flex gap-2">
            {WIDTHS.map((w) => (
              <Button
                key={w.value}
                variant={w.value === width ? "default" : "outline"}
                size="sm"
                onClick={() => setWidth(w.value)}
              >
                {w.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview((p) => !p)}>
            {showPreview ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            Vista previa
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleDownload()}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {showPreview && (
        <div className="border rounded-lg bg-white shadow-sm inline-block">
          <div id="ticket-print-root">
            <TicketTemplate data={ticket} widthMm={width} />
          </div>
        </div>
      )}
    </div>
  );
}
