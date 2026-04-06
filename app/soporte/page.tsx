"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Mail, 
  BookOpen, 
  HelpCircle,
  Search,
  Phone,
  Clock
} from "lucide-react";
import { useState } from "react";

type SupportFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function SoportePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<SupportFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [mailtoFallback, setMailtoFallback] = useState("");

  const supportEmail = "soportevendimax@gmail.com";

  const faqs = [
    {
      categoria: "Primeros Pasos",
      preguntas: [
        {
          pregunta: "¿Cómo creo mi primera venta?",
          respuesta: "Ve a Dashboard → Ventas → Nueva Venta. Selecciona productos, elige un cliente y confirma el método de pago.",
        },
        {
          pregunta: "¿Cómo agrego productos a mi inventario?",
          respuesta: "En Dashboard → Productos → Nuevo Producto. Completa nombre, precio, stock y demás información.",
        },
        {
          pregunta: "¿Puedo registrar clientes rápidamente?",
          respuesta: "Sí, desde la pantalla de Nueva Venta puedes crear clientes al instante sin salir del flujo.",
        },
      ],
    },
    {
      categoria: "Ventas y Pagos",
      preguntas: [
        {
          pregunta: "¿Qué métodos de pago acepta VendiMax?",
          respuesta: "Efectivo, Tarjeta de Débito, Tarjeta de Crédito, Transferencia, QR y Otro método personalizado.",
        },
        {
          pregunta: "¿Cómo cierro la caja al final del día?",
          respuesta: "Ve a Dashboard → Caja → Cerrar Caja. Verás un resumen con totales por método de pago antes de confirmar.",
        },
        {
          pregunta: "¿Puedo ver el historial de ventas?",
          respuesta: "Sí, en Dashboard → Ventas tienes el listado completo con filtros por fecha, cliente y método de pago.",
        },
      ],
    },
    {
      categoria: "Inventario",
      preguntas: [
        {
          pregunta: "¿El stock se actualiza automáticamente?",
          respuesta: "Sí, cada vez que realizas una venta, el stock de los productos se descuenta automáticamente.",
        },
        {
          pregunta: "¿Puedo configurar alertas de stock bajo?",
          respuesta: "Sí, al crear o editar un producto puedes definir el Stock Mínimo para recibir alertas.",
        },
        {
          pregunta: "¿Cómo importo productos en masa?",
          respuesta: "Actualmente en desarrollo. Próximamente podrás importar CSV con todos tus productos.",
        },
      ],
    },
    {
      categoria: "Reportes y Datos",
      preguntas: [
        {
          pregunta: "¿Puedo exportar mis ventas?",
          respuesta: "El módulo de reportes permite exportar a CSV con filtros personalizados (disponible en Plan Pro).",
        },
        {
          pregunta: "¿Cómo veo mis mejores productos?",
          respuesta: "En el módulo de Reportes encontrarás estadísticas de productos más vendidos y rentabilidad.",
        },
      ],
    },
  ];

  const filteredFaqs = faqs.map(categoria => ({
    ...categoria,
    preguntas: categoria.preguntas.filter(
      p => 
        p.pregunta.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.respuesta.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(c => c.preguntas.length > 0);

  const handleFormChange = (
    field: keyof SupportFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSupportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setMailtoFallback("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data: { error?: string; message?: string } = await response.json();

      if (!response.ok) {
        const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
          `Nombre: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
        )}`;
        setMailtoFallback(mailto);
        setSubmitError(data.error || "No se pudo enviar la consulta.");
        return;
      }

      setSubmitSuccess(data.message || "Consulta enviada correctamente.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setMailtoFallback("");
    } catch {
      const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
        `Nombre: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
      )}`;
      setMailtoFallback(mailto);
      setSubmitError("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Centro de Soporte
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Encuentra respuestas rápidas o contacta con nuestro equipo
            </p>

            {/* Buscador */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar en preguntas frecuentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg"
              />
            </div>
          </div>

          {/* Opciones de contacto */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Chat en Vivo</h3>
              <p className="text-sm text-gray-600 mb-4">
                Chatea con nuestro equipo en tiempo real
              </p>
              <Button variant="outline" size="sm">Iniciar Chat</Button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-sm text-gray-600 mb-4">
                soportevendimax@gmail.com
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="#formulario-soporte">Enviar Consulta</a>
              </Button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Teléfono</h3>
              <p className="text-sm text-gray-600 mb-4">
                3543515007
              </p>
              <Button variant="outline" size="sm">Llamar Ahora</Button>
            </div>
          </div>

          {/* Horarios */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-16 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-gray-900">Horarios de Atención</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Lunes a Viernes:</strong> 9:00 - 18:00 (UTC-3)</p>
              <p><strong>Sábados:</strong> 10:00 - 14:00 (UTC-3)</p>
              <p><strong>Domingos:</strong> Cerrado</p>
            </div>
          </div>

          {/* FAQs */}
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold text-gray-900">
                Preguntas Frecuentes
              </h2>
            </div>

            {filteredFaqs.length > 0 ? (
              <div className="space-y-8">
                {filteredFaqs.map((categoria, catIdx) => (
                  <div key={catIdx}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {categoria.categoria}
                    </h3>
                    <div className="space-y-4">
                      {categoria.preguntas.map((faq, idx) => (
                        <details
                          key={idx}
                          className="bg-white border border-gray-200 rounded-lg p-5 cursor-pointer hover:border-primary transition-colors"
                        >
                          <summary className="font-medium text-gray-900 list-none flex items-center justify-between">
                            {faq.pregunta}
                            <HelpCircle className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                          </summary>
                          <p className="text-gray-600 mt-3 leading-relaxed">
                            {faq.respuesta}
                          </p>
                        </details>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron resultados para &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>

          {/* Formulario de contacto */}
          <div id="formulario-soporte" className="mt-20 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              ¿No encontraste lo que buscabas?
            </h2>
            <form className="space-y-4" onSubmit={handleSupportSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  name="name"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={(event) => handleFormChange("name", event.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Tu email"
                  value={formData.email}
                  onChange={(event) => handleFormChange("email", event.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Input
                name="subject"
                placeholder="Asunto"
                value={formData.subject}
                onChange={(event) => handleFormChange("subject", event.target.value)}
                required
                disabled={isSubmitting}
              />
              <Textarea
                name="message"
                placeholder="Describe tu consulta..."
                rows={5}
                value={formData.message}
                onChange={(event) => handleFormChange("message", event.target.value)}
                required
                disabled={isSubmitting}
              />
              {submitError && (
                <div className="space-y-3">
                  <p className="text-sm text-red-600">{submitError}</p>
                  {mailtoFallback && (
                    <a
                      href={mailtoFallback}
                      className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                    >
                      Enviar desde mi correo
                    </a>
                  )}
                </div>
              )}
              {submitSuccess && (
                <p className="text-sm text-green-700">{submitSuccess}</p>
              )}
              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Consulta"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
