import Link from "next/link";

const endpoints = [
  {
    name: "Autenticación",
    method: "POST",
    path: "/api/auth/login",
    description: "Intercambia credenciales por un token de sesión.",
  },
  {
    name: "Productos",
    method: "GET",
    path: "/api/products",
    description: "Lista productos con paginación y filtros básicos.",
  },
  {
    name: "Ventas",
    method: "POST",
    path: "/api/sales",
    description: "Registra una venta y descuenta stock.",
  },
  {
    name: "Sucursales",
    method: "GET",
    path: "/api/branches",
    description: "Obtiene las sucursales disponibles para el usuario.",
  },
];

export default function ApiDocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <p className="text-sm uppercase tracking-wide text-primary/80 font-semibold">Documentación</p>
      <h1 className="text-4xl font-bold text-gray-900 mt-2">API de VendiMax</h1>
      <p className="text-gray-600 mt-3">
        Endpoints básicos para integrar ventas, stock y sucursales con VendiMax. Usa el dominio de tu despliegue y
        tokens de sesión obtenidos vía autenticación.
      </p>

      <div className="mt-8 grid gap-4">
        {endpoints.map((ep) => (
          <div key={ep.path} className="border border-gray-200 rounded-lg p-4 bg-white/70 shadow-sm">
            <div className="flex items-center gap-3 text-sm">
              <span className="px-2 py-1 rounded bg-primary/10 text-primary font-semibold">{ep.method}</span>
              <code className="text-gray-800">{ep.path}</code>
            </div>
            <p className="text-gray-700 mt-2">{ep.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-sm text-gray-600">
        ¿Necesitas un endpoint extra? Escríbenos a{" "}
        <a className="text-primary font-medium" href="mailto:soportevendimax@gmail.com">
          soportevendimax@gmail.com
        </a>{" "}
        o revisa las <Link className="text-primary font-medium hover:underline" href="/integraciones">integraciones</Link>{" "}
        disponibles.
      </div>
    </div>
  );
}
