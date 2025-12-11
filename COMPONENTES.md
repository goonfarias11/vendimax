# Documentación de Componentes - VendiMax

## Componentes UI Base

### Button (`components/ui/button.tsx`)

Componente de botón reutilizable con múltiples variantes.

**Variantes:**
- `default`: Botón primario azul
- `destructive`: Botón de acción destructiva (rojo)
- `outline`: Botón con borde
- `secondary`: Botón secundario
- `ghost`: Botón sin fondo
- `link`: Botón estilo enlace

**Tamaños:**
- `default`: Tamaño estándar
- `sm`: Pequeño
- `lg`: Grande
- `icon`: Para iconos

**Ejemplo:**
```tsx
<Button variant="default" size="lg">
  Empezar Gratis
</Button>
```

### Card (`components/ui/card.tsx`)

Componente de tarjeta modular con sub-componentes.

**Sub-componentes:**
- `Card`: Contenedor principal
- `CardHeader`: Encabezado
- `CardTitle`: Título
- `CardDescription`: Descripción
- `CardContent`: Contenido principal
- `CardFooter`: Pie de tarjeta

**Ejemplo:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>
    Contenido aquí
  </CardContent>
</Card>
```

## Componentes de Secciones

### Navbar (`components/navbar.tsx`)

Barra de navegación sticky con menú responsive.

**Características:**
- Menú hamburguesa en móvil
- Enlaces de navegación smooth scroll
- Botones CTA (Login/Registro)
- Logo animado

### HeroSection (`components/hero-section.tsx`)

Sección principal de la landing page.

**Características:**
- Animaciones con Framer Motion
- CTA destacado
- Estadísticas del negocio
- Mockup visual del producto
- Elementos flotantes animados

### BeneficiosSection (`components/beneficios-section.tsx`)

Grid de tarjetas mostrando beneficios del producto.

**Características:**
- 6 tarjetas de beneficios
- Iconos de Lucide React
- Animación al scroll (scroll-triggered)
- Grid responsive (1-2-3 columnas)

### FuncionesSection (`components/funciones-section.tsx`)

Muestra las funcionalidades principales del sistema.

**Características:**
- Grid de funciones con iconos
- Lista de características por función
- Efectos hover
- Diseño responsive

### PreciosSection (`components/precios-section.tsx`)

Tabla de precios con 3 planes.

**Características:**
- 3 niveles de precios
- Plan destacado (Profesional)
- Lista de features incluidas
- Botones CTA por plan

### DashboardDemo (`components/dashboard-demo.tsx`)

Vista previa interactiva del dashboard.

**Características:**
- Mockup del dashboard
- Tarjetas de estadísticas
- Gráfico de barras animado
- Lista de productos más vendidos
- Animaciones con Framer Motion

### Footer (`components/footer.tsx`)

Pie de página con información y enlaces.

**Características:**
- 4 columnas de información
- Enlaces a redes sociales
- Información de contacto
- Copyright y enlaces legales

## Utilidades

### `lib/utils.ts`

Función `cn()` para combinar clases de Tailwind.

```tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class")} />
```

### `lib/config.ts`

Configuración centralizada de SEO y metadata.

**Variables:**
- `name`: Nombre del sitio
- `description`: Descripción para SEO
- `url`: URL del sitio
- `ogImage`: Imagen para Open Graph
- `keywords`: Keywords para SEO

## Paleta de Colores CSS

Variables definidas en `app/globals.css`:

```css
--primary: 217 91% 60%        /* Azul principal */
--secondary: 210 40% 96.1%    /* Gris claro */
--muted: 210 40% 96.1%        /* Texto apagado */
--accent: 210 40% 96.1%       /* Color de acento */
```

## Animaciones

### Framer Motion

Animaciones suaves en componentes interactivos:

- **Fade In + Slide Up**: `initial={{ opacity: 0, y: 20 }}`
- **Scale**: `initial={{ opacity: 0, scale: 0.95 }}`
- **Floating**: `animate={{ y: [0, -10, 0] }}`

**Ejemplo:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Contenido
</motion.div>
```

## Responsive Design

### Breakpoints de Tailwind

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Ejemplo:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
```

## Mejores Prácticas

1. **Componentes**: Mantener componentes pequeños y reutilizables
2. **Tipos**: Usar TypeScript para todas las props
3. **Estilos**: Preferir utilidades de Tailwind sobre CSS custom
4. **Animaciones**: Usar `viewport={{ once: true }}` para optimizar
5. **Accesibilidad**: Incluir alt text, aria-labels cuando sea necesario
6. **SEO**: Usar etiquetas semánticas HTML5

## Extensión del Proyecto

### Agregar nueva página

1. Crear archivo en `app/nombre-pagina/page.tsx`
2. Definir metadata
3. Exportar componente de página

```tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Página",
  description: "Descripción",
};

export default function MiPagina() {
  return <div>Contenido</div>;
}
```

### Agregar nuevo componente

1. Crear archivo en `components/mi-componente.tsx`
2. Definir tipos para props
3. Exportar componente

```tsx
interface MiComponenteProps {
  titulo: string;
  descripcion?: string;
}

export function MiComponente({ titulo, descripcion }: MiComponenteProps) {
  return <div>{titulo}</div>;
}
```

### Agregar componente UI

1. Crear en `components/ui/`
2. Usar `cn()` para clases
3. Seguir patrón de shadcn/ui

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion)
- [Lucide Icons](https://lucide.dev)
