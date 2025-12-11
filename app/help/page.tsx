"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  Search,
  Mail,
  Phone,
} from "lucide-react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpSections = [
    {
      id: "pos",
      icon: <ShoppingCart className="h-5 w-5" />,
      title: "Punto de Venta",
      items: [
        {
          question: "¿Cómo realizar una venta?",
          answer:
            "1. Ve al menú Punto de Venta. 2. Busca productos por nombre o escanea el código de barras. 3. Agrega productos al carrito. 4. Selecciona el método de pago (efectivo, tarjeta, QR). 5. Confirma la venta. Se generará un comprobante automáticamente.",
        },
        {
          question: "¿Cómo hacer un pago mixto?",
          answer:
            "En la pantalla de pago, selecciona 'Pago Mixto'. Luego elige los métodos de pago (ej: $5000 en efectivo + $3000 en tarjeta). El sistema calculará automáticamente el cambio si corresponde.",
        },
        {
          question: "¿Cómo cancelar una venta?",
          answer:
            "Ve a Reportes > Ventas, busca la venta que deseas cancelar, haz clic en los tres puntos y selecciona 'Cancelar Venta'. El stock se reintegrará automáticamente.",
        },
      ],
    },
    {
      id: "products",
      icon: <Package className="h-5 w-5" />,
      title: "Productos e Inventario",
      items: [
        {
          question: "¿Cómo agregar un producto nuevo?",
          answer:
            "1. Ve a Productos en el menú lateral. 2. Haz clic en 'Nuevo Producto'. 3. Completa los campos obligatorios: nombre, SKU, precio, costo y stock inicial. 4. Opcionalmente agrega categoría, código de barras e imágenes. 5. Guarda el producto.",
        },
        {
          question: "¿Cómo funciona el control de stock?",
          answer:
            "El sistema controla el stock automáticamente. Cada venta descuenta del stock, cada compra suma al stock. Puedes configurar alertas de stock mínimo en cada producto. El dashboard mostrará productos con stock bajo.",
        },
        {
          question: "¿Puedo crear productos con variantes?",
          answer:
            "Sí. Al crear un producto, activa 'Tiene Variantes'. Luego puedes agregar combinaciones de talle, color, o cualquier característica. Cada variante tendrá su propio SKU y stock.",
        },
      ],
    },
    {
      id: "reports",
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Reportes y Estadísticas",
      items: [
        {
          question: "¿Qué reportes están disponibles?",
          answer:
            "VendiMax ofrece: Reporte de Ventas (diarias, semanales, mensuales), Productos Más Vendidos, Reporte de Stock, Reporte de Clientes con Cuenta Corriente, Reporte de Métodos de Pago, y Dashboard en Tiempo Real con KPIs.",
        },
        {
          question: "¿Cómo exportar reportes?",
          answer:
            "En cualquier pantalla de reporte, encontrarás un botón 'Exportar'. Puedes descargar en formato Excel (.xlsx) o PDF. Los reportes incluyen gráficos y tablas con todos los datos filtrados.",
        },
        {
          question: "¿Cuánto tiempo se guardan los datos?",
          answer:
            "Todos los datos se guardan de forma permanente. Puedes consultar ventas, compras y movimientos de cualquier fecha histórica sin límite de tiempo.",
        },
      ],
    },
    {
      id: "users",
      icon: <Users className="h-5 w-5" />,
      title: "Usuarios y Permisos",
      items: [
        {
          question: "¿Qué roles de usuario existen?",
          answer:
            "OWNER (acceso total), GERENTE (reportes y configuración), VENDEDOR (ventas y productos), CAJERO (solo ventas), SUPERVISOR (ver reportes). Cada rol tiene permisos específicos.",
        },
        {
          question: "¿Cómo agregar un nuevo usuario?",
          answer:
            "Ve a Configuración > Usuarios. Haz clic en 'Nuevo Usuario', completa nombre, email y selecciona el rol. El usuario recibirá un email para crear su contraseña.",
        },
        {
          question: "¿Cuántos usuarios puedo tener?",
          answer:
            "Depende de tu plan: Plan Básico (1 usuario), Plan Pro (3 usuarios), Plan Full (10 usuarios). Si necesitas más usuarios, puedes actualizar tu plan.",
        },
      ],
    },
    {
      id: "payments",
      icon: <CreditCard className="h-5 w-5" />,
      title: "Pagos y Suscripción",
      items: [
        {
          question: "¿Cómo funciona la prueba gratuita?",
          answer:
            "Al registrarte, obtienes 7 días de prueba gratuita del Plan PRO sin necesidad de tarjeta de crédito. Puedes probar todas las funcionalidades sin restricciones.",
        },
        {
          question: "¿Cómo actualizar mi plan?",
          answer:
            "Ve a Configuración > Suscripción. Selecciona el plan que deseas y confirma. El pago se procesa con MercadoPago. El cambio es inmediato y se prorratea si cambias durante el mes.",
        },
        {
          question: "¿Qué incluye cada plan?",
          answer:
            "Plan Básico ($8,500/mes): 500 productos, 1,000 ventas/mes, 3 usuarios. Plan Pro ($14,000/mes): 5,000 productos, 10,000 ventas/mes, 10 usuarios, reportes avanzados. Plan Full ($22,000/mes): Productos y ventas ilimitadas, usuarios ilimitados, soporte prioritario.",
        },
      ],
    },
    {
      id: "settings",
      icon: <Settings className="h-5 w-5" />,
      title: "Configuración",
      items: [
        {
          question: "¿Cómo configurar mi negocio?",
          answer:
            "Ve a Configuración > Negocio. Completa el nombre, dirección, CUIT/CUIL, email y teléfono. Esta información aparecerá en los comprobantes y facturas.",
        },
        {
          question: "¿Puedo personalizar los comprobantes?",
          answer:
            "Sí. En Configuración > Comprobantes puedes agregar tu logo, mensaje personalizado, información de contacto y términos y condiciones.",
        },
        {
          question: "¿Cómo hacer backup de mis datos?",
          answer:
            "Los datos se respaldan automáticamente cada día. Puedes solicitar una exportación completa en formato JSON desde Configuración > Datos. El backup incluye todos los productos, ventas, clientes y configuración.",
        },
      ],
    },
  ];

  const filteredSections = searchQuery
    ? helpSections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.answer.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0)
    : helpSections;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Centro de Ayuda</h1>
            <p className="text-xl text-blue-100">
              Todo lo que necesitas saber sobre VendiMax
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar en la ayuda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Quick Links */}
        {!searchQuery && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {helpSections.map((section) => (
              <Card
                key={section.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  const element = document.getElementById(section.id);
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="mx-auto mb-2 text-blue-600">{section.icon}</div>
                  <p className="text-sm font-medium">{section.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* FAQ Sections */}
        <div className="space-y-8">
          {filteredSections.map((section) => (
            <Card key={section.id} id={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {section.icon}
                  <span>{section.title}</span>
                </CardTitle>
                <CardDescription>
                  Preguntas frecuentes sobre {section.title.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 whitespace-pre-line">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>¿No encontraste lo que buscas?</CardTitle>
            <CardDescription>Nuestro equipo está aquí para ayudarte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Email de Soporte</p>
                <a
                  href="mailto:soporte@vendimax.com"
                  className="text-blue-600 hover:underline"
                >
                  soporte@vendimax.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Teléfono</p>
                <a href="tel:+5491112345678" className="text-blue-600 hover:underline">
                  +54 9 11 1234-5678
                </a>
              </div>
            </div>
            <div className="pt-4">
              <Button className="w-full sm:w-auto" asChild>
                <a href="mailto:soporte@vendimax.com">Contactar Soporte</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
