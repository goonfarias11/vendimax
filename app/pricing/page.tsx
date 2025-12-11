import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Planes y Precios</h1>
          <p className="text-xl text-gray-600">
            Elige el plan perfecto para tu negocio. Todos incluyen 7 días de prueba gratis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <PlanCard
            name="Básico"
            price="$8,500"
            description="Ideal para pequeños comercios"
            features={[
              { name: "Hasta 500 productos", included: true },
              { name: "1,000 ventas/mes", included: true },
              { name: "3 usuarios", included: true },
              { name: "1 local", included: true },
              { name: "Reportes básicos", included: true },
              { name: "Soporte por email", included: true },
              { name: "Reportes avanzados", included: false },
              { name: "Exportación de datos", included: false },
              { name: "API de integración", included: false },
            ]}
          />

          <PlanCard
            name="Pro"
            price="$14,000"
            description="Para negocios en crecimiento"
            badge="Más Popular"
            highlighted={true}
            features={[
              { name: "Hasta 5,000 productos", included: true },
              { name: "10,000 ventas/mes", included: true },
              { name: "10 usuarios", included: true },
              { name: "3 locales", included: true },
              { name: "Reportes avanzados", included: true },
              { name: "Exportación de datos", included: true },
              { name: "Soporte prioritario", included: true },
              { name: "Cuenta corriente clientes", included: true },
              { name: "API de integración", included: false },
            ]}
          />

          <PlanCard
            name="Full"
            price="$22,000"
            description="Sin límites para grandes empresas"
            features={[
              { name: "Productos ilimitados", included: true },
              { name: "Ventas ilimitadas", included: true },
              { name: "Usuarios ilimitados", included: true },
              { name: "Locales ilimitados", included: true },
              { name: "Todos los reportes", included: true },
              { name: "Exportación de datos", included: true },
              { name: "API de integración", included: true },
              { name: "Soporte 24/7", included: true },
              { name: "Capacitación personalizada", included: true },
            ]}
          />
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Comparación Detallada</h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-semibold">Característica</th>
                  <th className="text-center p-4 font-semibold">Básico</th>
                  <th className="text-center p-4 font-semibold">Pro</th>
                  <th className="text-center p-4 font-semibold">Full</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <ComparisonRow feature="Productos" basic="500" pro="5,000" full="Ilimitado" />
                <ComparisonRow feature="Ventas/mes" basic="1,000" pro="10,000" full="Ilimitado" />
                <ComparisonRow feature="Usuarios" basic="3" pro="10" full="Ilimitado" />
                <ComparisonRow feature="Locales" basic="1" pro="3" full="Ilimitado" />
                <ComparisonRow feature="POS Rápido" basic="✓" pro="✓" full="✓" />
                <ComparisonRow feature="Gestión de Stock" basic="✓" pro="✓" full="✓" />
                <ComparisonRow feature="Variantes de Productos" basic="✓" pro="✓" full="✓" />
                <ComparisonRow feature="Pagos Mixtos" basic="✓" pro="✓" full="✓" />
                <ComparisonRow feature="Reportes Básicos" basic="✓" pro="✓" full="✓" />
                <ComparisonRow feature="Reportes Avanzados" basic="-" pro="✓" full="✓" />
                <ComparisonRow feature="CRM Clientes" basic="Básico" pro="Completo" full="Completo" />
                <ComparisonRow feature="Cuenta Corriente" basic="-" pro="✓" full="✓" />
                <ComparisonRow feature="Multi-usuario con Roles" basic="✓" pro="✓" full="✓" />
                <ComparisonRow feature="Exportación de Datos" basic="-" pro="✓" full="✓" />
                <ComparisonRow feature="API de Integración" basic="-" pro="-" full="✓" />
                <ComparisonRow feature="Soporte" basic="Email" pro="Prioritario" full="24/7" />
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">¿Listo para empezar?</h3>
          <p className="text-gray-600 mb-8">
            Prueba cualquier plan gratis por 7 días. Sin tarjeta de crédito requerida.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6">
              Comenzar Prueba Gratuita
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  description,
  badge,
  highlighted,
  features,
}: {
  name: string;
  price: string;
  description: string;
  badge?: string;
  highlighted?: boolean;
  features: { name: string; included: boolean }[];
}) {
  return (
    <div
      className={`bg-white p-8 rounded-lg border-2 ${
        highlighted ? "border-blue-600 shadow-xl scale-105" : "border-gray-200"
      } relative`}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
          {badge}
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-gray-600">/mes</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            {feature.included ? (
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? "text-gray-700" : "text-gray-400"}>{feature.name}</span>
          </li>
        ))}
      </ul>
      <Link href="/register">
        <Button className="w-full" variant={highlighted ? "default" : "outline"}>
          Empezar Prueba
        </Button>
      </Link>
    </div>
  );
}

function ComparisonRow({
  feature,
  basic,
  pro,
  full,
}: {
  feature: string;
  basic: string;
  pro: string;
  full: string;
}) {
  return (
    <tr>
      <td className="p-4 font-medium">{feature}</td>
      <td className="p-4 text-center text-gray-600">{basic}</td>
      <td className="p-4 text-center text-gray-600">{pro}</td>
      <td className="p-4 text-center text-gray-600">{full}</td>
    </tr>
  );
}
