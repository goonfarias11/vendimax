import Link from "next/link";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
};

const posts: Post[] = [
  {
    slug: "novedades-marzo",
    title: "Novedades de marzo: cierres de caja y multi-sucursal",
    excerpt:
      "Repasamos las mejoras recientes: nuevo flujo de cierre de caja, métricas en tiempo real y soporte multi-sucursal simplificado.",
    date: "2026-03-15",
    category: "Producto",
  },
  {
    slug: "guia-facturacion-afip",
    title: "Guía rápida para configurar facturación con AFIP",
    excerpt:
      "Paso a paso para dar de alta tu facturación electrónica en VendiMax y evitar rechazos de comprobantes.",
    date: "2026-02-28",
    category: "Tutorial",
  },
  {
    slug: "caso-exito-retail",
    title: "Caso de éxito: cómo Nano Market redujo quiebres de stock 35%",
    excerpt:
      "Conversamos con el equipo de Nano Market sobre control de inventario, alertas y mejores prácticas.",
    date: "2026-02-10",
    category: "Historias",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-wide text-primary/80 font-semibold">Blog</p>
        <h1 className="text-4xl font-bold text-gray-900 mt-2">Actualizaciones y recursos de VendiMax</h1>
        <p className="text-gray-600 mt-3">
          Novedades del producto, guías rápidas y casos de éxito para sacar el máximo provecho a tu operación.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-xl border border-gray-200 bg-white/70 shadow-sm p-6 hover:-translate-y-1 hover:shadow-md transition"
          >
            <div className="text-xs uppercase tracking-wide text-primary font-semibold">{post.category}</div>
            <h2 className="text-2xl font-semibold mt-2 text-gray-900">{post.title}</h2>
            <p className="text-gray-600 mt-3 leading-relaxed">{post.excerpt}</p>
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{new Date(post.date).toLocaleDateString("es-AR")}</span>
              <Link href={`/blog/${post.slug}`} className="text-primary font-medium hover:underline">
                Leer más
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 text-sm text-gray-500">
        ¿Tienes un tema que quisieras que cubramos? Escríbenos a{" "}
        <a className="text-primary font-medium" href="mailto:soportevendimax@gmail.com">
          soportevendimax@gmail.com
        </a>
        .
      </div>
    </div>
  );
}
