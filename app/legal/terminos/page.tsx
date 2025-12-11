"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-gray-600 mb-8">
            Última actualización: 9 de diciembre de 2025
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Aceptación de los Términos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Al acceder y usar VendiMax ("el Servicio"), aceptas estar sujeto a estos Términos y Condiciones ("Términos"). 
                Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestro servicio.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor 
                inmediatamente después de su publicación en esta página.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Descripción del Servicio
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                VendiMax es un sistema de punto de venta (POS) en la nube que permite a los negocios gestionar ventas, 
                inventario, clientes y caja de forma centralizada.
              </p>
              <p className="text-gray-700 leading-relaxed">
                El servicio incluye:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Gestión de ventas y facturación</li>
                <li>Control de inventario y productos</li>
                <li>Administración de clientes</li>
                <li>Cierre de caja y reportes</li>
                <li>Sistema de usuarios con roles</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Registro y Cuenta de Usuario
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Para usar VendiMax debes crear una cuenta proporcionando información precisa y completa. Eres responsable de:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Mantener la confidencialidad de tu contraseña</li>
                <li>Todas las actividades que ocurran bajo tu cuenta</li>
                <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
                <li>Asegurar que tu información de contacto esté actualizada</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Planes y Pagos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                VendiMax ofrece diferentes planes de suscripción:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Plan Free:</strong> Gratuito con limitaciones de uso</li>
                <li><strong>Plan Pro:</strong> Suscripción mensual con funcionalidades completas</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Los pagos se procesan de forma segura a través de proveedores de pago certificados. 
                Las suscripciones se renuevan automáticamente a menos que se cancelen antes del próximo período de facturación.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Ofrecemos garantía de reembolso de 30 días para el Plan Pro. Los reembolsos se procesan dentro de 5-10 días hábiles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Uso Aceptable
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Al usar VendiMax, aceptas NO:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Violar leyes o regulaciones aplicables</li>
                <li>Infringir derechos de propiedad intelectual</li>
                <li>Transmitir virus, malware o código malicioso</li>
                <li>Intentar acceder de forma no autorizada a sistemas o datos</li>
                <li>Interferir con el funcionamiento normal del servicio</li>
                <li>Usar el servicio para actividades fraudulentas</li>
                <li>Revender o redistribuir el servicio sin autorización</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Propiedad Intelectual
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                VendiMax y todo su contenido, características y funcionalidad son propiedad exclusiva de VendiMax y están 
                protegidos por derechos de autor, marcas registradas y otras leyes de propiedad intelectual.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Tus datos (ventas, productos, clientes) permanecen de tu propiedad. Nos otorgas una licencia limitada 
                para procesar y almacenar estos datos únicamente con el fin de proveer el servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Limitación de Responsabilidad
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                VendiMax se proporciona "tal cual" sin garantías de ningún tipo. No garantizamos que el servicio será 
                ininterrumpido, seguro o libre de errores.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                En ningún caso seremos responsables por daños indirectos, incidentales, especiales o consecuentes, 
                incluyendo pérdida de beneficios, datos o uso.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Nuestra responsabilidad total no excederá el monto pagado por el servicio en los últimos 12 meses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Respaldo y Seguridad de Datos
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Realizamos respaldos regulares de los datos, pero recomendamos que mantengas copias propias de 
                información crítica. Implementamos medidas de seguridad razonables, pero no podemos garantizar 
                seguridad absoluta.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Cancelación y Terminación
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta. 
                La cancelación será efectiva al final del período de facturación actual.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos, 
                con o sin previo aviso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Ley Aplicable
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Estos términos se rigen por las leyes de Argentina. Cualquier disputa será resuelta en los 
                tribunales de la Ciudad Autónoma de Buenos Aires.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Contacto
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Para preguntas sobre estos Términos y Condiciones, contáctanos en:
              </p>
              <p className="text-gray-700 mt-4">
                <strong>Email:</strong> legal@vendimax.com<br />
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
