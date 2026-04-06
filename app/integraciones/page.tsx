import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plug, ShoppingCart, CreditCard, FileText, MessageSquare } from "lucide-react";

const integrations = [
  {
    title: "Mercado Pago",
    description: "Cobros y suscripciones en ARS con conciliacion desde VendiMax.",
    icon: <CreditCard className="h-5 w-5" />,
    status: "Activo",
  },
  {
    title: "Facturacion ARCA",
    description: "Emision de comprobantes electronicos y gestion de CAE.",
    icon: <FileText className="h-5 w-5" />,
    status: "Activo",
  },
  {
    title: "Tienda Online",
    description: "Sincronizacion de catalogo y stock para canal e-commerce.",
    icon: <ShoppingCart className="h-5 w-5" />,
    status: "Proximamente",
  },
  {
    title: "WhatsApp Business",
    description: "Notificaciones de ventas y mensajes automaticos a clientes.",
    icon: <MessageSquare className="h-5 w-5" />,
    status: "Proximamente",
  },
];

export default function IntegracionesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
            <Plug className="h-4 w-4" />
            Ecosistema VendiMax
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Integraciones</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Conecta tus herramientas favoritas y centraliza ventas, cobros y operaciones en un solo lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.title}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    {integration.icon}
                    {integration.title}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {integration.status}
                  </span>
                </CardTitle>
                <CardDescription>{integration.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/soporte">Solicitar activacion</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
