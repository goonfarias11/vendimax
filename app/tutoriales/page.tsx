"use client";

import Link from "next/link";

type Tutorial = {
  slug: string;
  title: string;
  summary: string;
  duration: string;
  level: "Basico" | "Intermedio" | "Avanzado";
};

const tutorials: Tutorial[] = [
  {
    slug: "venta-en-caja",
    title: "Primera venta en caja",
    summary: "Configura tu primer caja, carga productos y registra una venta paso a paso.",
    duration: "6 min",
    level: "Basico",
  },
  {
    slug: "inventario-alertas",
    title: "Control de inventario y alertas",
    summary: "Carga stock, crea alertas de stock minimo y revisa movimientos en tiempo real.",
    duration: "8 min",
    level: "Intermedio",
  },
  {
    slug: "facturacion-afip",
    title: "Facturacion electronica AFIP",
    summary: "Conecta tu CUIT y genera comprobantes sin rechazos, con ejemplos de pruebas.",
    duration: "9 min",
    level: "Intermedio",
  },
  {
    slug: "reportes-cierre-caja",
    title: "Cierres de caja y reportes diarios",
    summary: "Cómo hacer cierres, reconciliar medios de pago y exportar reportes a Excel/PDF.",
    duration: "7 min",
    level: "Basico",
  },
];

export default function TutorialesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-wide text-primary/80 font-semibold">Tutoriales</p>
        <h1 className="text-4xl font-bold text-gray-900 mt-2">Aprende VendiMax en minutos</h1>
        <p className="text-gray-600 mt-3">
          Guías cortas con pasos claros para que tu equipo pueda vender, controlar stock y facturar sin fricción.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {tutorials.map((tutorial) => (
          <article
            key={tutorial.slug}
            className="rounded-xl border border-gray-200 bg-white/70 shadow-sm p-6 hover:-translate-y-1 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">{tutorial.level}</span>
              <span>{tutorial.duration}</span>
            </div>
            <h2 className="text-2xl font-semibold mt-2 text-gray-900">{tutorial.title}</h2>
            <p className="text-gray-600 mt-3 leading-relaxed">{tutorial.summary}</p>
            <div className="mt-4">
              <Link
                href={`/tutoriales/${tutorial.slug}`}
                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                Ver paso a paso
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 text-sm text-gray-500">
        ¿Necesitas un tutorial específico? Escríbenos a{" "}
        <a className="text-primary font-medium" href="mailto:soportevendimax@gmail.com">
          soportevendimax@gmail.com
        </a>
        .
      </div>
    </div>
  );
}
