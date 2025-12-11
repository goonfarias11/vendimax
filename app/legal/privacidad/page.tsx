"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Política de Privacidad
          </h1>
          <p className="text-gray-600 mb-8">
            Última actualización: 9 de diciembre de 2025
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introducción
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                En VendiMax ("nosotros", "nuestro"), respetamos tu privacidad y nos comprometemos a proteger 
                tus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos 
                y protegemos tu información cuando utilizas nuestro servicio.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Al usar VendiMax, aceptas las prácticas descritas en esta política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Información que Recopilamos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Recopilamos diferentes tipos de información:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                2.1 Información de Cuenta
              </h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Nombre y apellido</li>
                <li>Dirección de email</li>
                <li>Contraseña (encriptada)</li>
                <li>Rol de usuario (Admin/Seller)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                2.2 Datos de Negocio
              </h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Información de productos (nombre, precio, stock)</li>
                <li>Información de clientes (nombre, email, teléfono, dirección)</li>
                <li>Registros de ventas y transacciones</li>
                <li>Movimientos de caja</li>
                <li>Reportes y estadísticas</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                2.3 Información Técnica
              </h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Dirección IP</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Sistema operativo</li>
                <li>Páginas visitadas y tiempo de uso</li>
                <li>Cookies y tecnologías similares</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Cómo Usamos tu Información
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Proveer y mantener el servicio VendiMax</li>
                <li>Procesar transacciones y gestionar tu cuenta</li>
                <li>Enviar notificaciones importantes sobre el servicio</li>
                <li>Mejorar y personalizar tu experiencia</li>
                <li>Analizar el uso del servicio y detectar problemas</li>
                <li>Prevenir fraude y garantizar la seguridad</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Contactarte con actualizaciones y ofertas (con tu consentimiento)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Compartir Información
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                NO vendemos tu información personal. Podemos compartir datos limitados con:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Proveedores de servicios:</strong> Hosting (Vercel), base de datos (Neon), 
                procesamiento de pagos, que actúan en nuestro nombre</li>
                <li><strong>Cumplimiento legal:</strong> Cuando sea requerido por ley o para proteger derechos</li>
                <li><strong>Transferencias comerciales:</strong> En caso de fusión, adquisición o venta de activos</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Todos nuestros proveedores están sujetos a estrictos acuerdos de confidencialidad.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Seguridad de Datos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Encriptación SSL/TLS para datos en tránsito</li>
                <li>Contraseñas hasheadas con bcrypt</li>
                <li>Autenticación segura con NextAuth</li>
                <li>Respaldos automáticos regulares</li>
                <li>Acceso limitado basado en roles</li>
                <li>Monitoreo de seguridad continuo</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Sin embargo, ningún sistema es 100% seguro. Usa contraseñas fuertes y reporta actividades sospechosas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Retención de Datos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Conservamos tu información mientras tu cuenta esté activa o según sea necesario para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Proveer servicios continuos</li>
                <li>Cumplir obligaciones legales (registros fiscales: 5-10 años)</li>
                <li>Resolver disputas y hacer cumplir acuerdos</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Cuando cancelas tu cuenta, eliminamos o anonimizamos tu información personal dentro de 90 días, 
                excepto lo requerido por ley.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Tus Derechos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Tienes derecho a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Acceso:</strong> Solicitar una copia de tus datos personales</li>
                <li><strong>Rectificación:</strong> Corregir información incorrecta o incompleta</li>
                <li><strong>Eliminación:</strong> Solicitar la eliminación de tus datos</li>
                <li><strong>Portabilidad:</strong> Exportar tus datos en formato CSV</li>
                <li><strong>Oposición:</strong> Rechazar ciertos usos de tu información</li>
                <li><strong>Restricción:</strong> Limitar el procesamiento de tus datos</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Para ejercer estos derechos, contáctanos en privacy@vendimax.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Cookies y Tecnologías de Seguimiento
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Usamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento del servicio</li>
                <li><strong>Cookies de preferencias:</strong> Recordar tu configuración</li>
                <li><strong>Cookies analíticas:</strong> Entender cómo usas el servicio</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Puedes controlar las cookies a través de tu navegador, pero algunas funcionalidades pueden verse afectadas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Transferencias Internacionales
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Tus datos pueden ser transferidos y procesados en servidores ubicados fuera de tu país. 
                Tomamos medidas para asegurar que tu información reciba protección adecuada conforme 
                a esta política y leyes aplicables.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Privacidad de Menores
              </h2>
              <p className="text-gray-700 leading-relaxed">
                VendiMax no está dirigido a menores de 18 años. No recopilamos intencionalmente información 
                de menores. Si descubrimos que hemos recopilado datos de un menor, los eliminaremos inmediatamente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Cambios a esta Política
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos 
                por email o mediante aviso en el servicio. El uso continuado después de los cambios constituye 
                tu aceptación de la política actualizada.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Contacto
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Para preguntas o inquietudes sobre privacidad:
              </p>
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@vendimax.com<br />
                <strong>Responsable de Protección de Datos:</strong> dpo@vendimax.com<br />
                <strong>Dirección:</strong> Av. Córdoba 1234, CABA, Argentina
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
