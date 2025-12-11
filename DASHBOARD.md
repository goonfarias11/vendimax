# Dashboard VendiMax - Documentación

## Estructura del Dashboard

El dashboard de VendiMax es un sistema completo de gestión POS con las siguientes características:

### 📐 Layout

#### Sidebar (Barra Lateral)
- **Ubicación**: Fija a la izquierda
- **Ancho**: 256px (expandido) / 64px (colapsado)
- **Responsive**: Se oculta en móvil y se muestra como drawer
- **Características**:
  - Colapsar/Expandir en desktop
  - Logo de VendiMax
  - 8 secciones de navegación
  - Información de usuario en la parte inferior

#### Topbar (Barra Superior)
- **Características**:
  - Buscador global
  - Botón de menú (móvil)
  - Notificaciones con badge animado
  - Avatar de usuario

### 📄 Páginas Implementadas

#### 1. Dashboard Principal (`/dashboard`)
**KPIs:**
- Ventas Hoy
- Total Ventas
- Tickets
- Margen Promedio

**Componentes:**
- Gráfico de ventas semanales (barras)
- Top 5 productos más vendidos
- Tabla de ventas recientes (10 registros)

#### 2. Ventas (`/dashboard/ventas`)
**Características:**
- Tabla completa de ventas
- Filtros por estado (Completado, Pendiente, Cancelado)
- Estadísticas: Total Ventas, Transacciones, Ticket Promedio
- Modal para nueva venta
- Exportar datos

**Columnas de la tabla:**
- ID, Cliente, Fecha/Hora, Items, Total, Método de Pago, Estado

#### 3. Inventario (`/dashboard/inventario`)
**Características:**
- Tabla de productos
- Alerta de stock bajo
- Filtros por categoría
- Modal para nuevo producto (con formulario completo)
- Estadísticas: Total Productos, Valor Inventario, Stock Total, Bajo Stock

**Columnas de la tabla:**
- SKU, Producto, Categoría, Precio, Stock, Vendidos, Estado

#### 4. Clientes (`/dashboard/clientes`)
**Características:**
- Tabla de clientes
- Modal para nuevo cliente
- Estadísticas: Total Clientes, Ticket Promedio, Total Facturado

**Columnas de la tabla:**
- ID, Nombre, Email, Teléfono, Compras, Total Gastado, Última Compra

#### 5. Proveedores (`/dashboard/proveedores`)
**Características:**
- Tabla de proveedores
- Modal para nuevo proveedor
- Estadísticas: Total Proveedores, Productos Suministrados

**Columnas de la tabla:**
- ID, Nombre, Contacto, Email, Teléfono, Productos, Último Pedido

#### 6. Caja (`/dashboard/caja`)
**Características:**
- KPIs: Saldo Actual, Ingresos, Egresos, Balance
- Lista de movimientos del día
- Indicadores visuales (verde para ingresos, rojo para egresos)
- Botones: Cerrar Caja, Nuevo Movimiento

#### 7. Reportes (`/dashboard/reportes`)
**Características:**
- KPIs: Ventas Totales, Productos Vendidos, Nuevos Clientes, Tasa Conversión
- Gráfico de ventas semanales
- Gráfico de ventas mensuales
- Métodos de pago (con barras de progreso)
- Categorías más vendidas
- Exportar PDF, Generar Reporte

#### 8. Configuración (`/dashboard/configuracion`)
**Secciones:**
- Perfil de Usuario
- Notificaciones (con checkboxes)
- Seguridad
- Apariencia (tema)
- Datos y Respaldo

## 🧩 Componentes Creados

### `DashboardSidebar`
```tsx
<DashboardSidebar isOpen={boolean} onClose={() => void} />
```
- Navegación principal
- Colapsar/Expandir
- Responsive

### `DashboardTopbar`
```tsx
<DashboardTopbar onMenuClick={() => void} />
```
- Buscador
- Notificaciones
- Menu móvil

### `KPICard`
```tsx
<KPICard 
  title="Ventas Hoy"
  value="$125,000"
  change="+12.5%"
  trend="up|down|neutral"
  icon={<Icon />}
/>
```
Tarjeta de indicador con icono, valor y tendencia.

### `DataTable`
```tsx
<DataTable 
  columns={[
    { key: "id", header: "ID" },
    { key: "name", header: "Nombre", cell: (row) => <custom /> }
  ]}
  data={array}
/>
```
Tabla genérica y reutilizable con soporte para custom cells.

### `Modal`
```tsx
<Modal
  isOpen={boolean}
  onClose={() => void}
  title="Título"
  size="sm|md|lg|xl"
>
  {children}
</Modal>
```
Modal reutilizable con backdrop y animaciones.

### `SimpleBarChart`
```tsx
<SimpleBarChart 
  data={[
    { label: "Lun", value: 125000 },
    { label: "Mar", value: 185000 }
  ]}
  height={200}
/>
```
Gráfico de barras simple con SVG.

## 📊 Datos Simulados

Todos los datos están en `lib/mock-data.ts`:

```typescript
export const mockSales        // 10 ventas
export const mockProducts     // 5 productos
export const mockClientes     // 3 clientes
export const mockProveedores  // 2 proveedores
export const topProducts      // 5 productos top
export const weekSalesData    // 7 días
```

## 🎨 Diseño

### Paleta de Colores
- **Primary**: `hsl(217 91% 60%)` - Azul para acciones principales
- **Success**: Verde para estados completados
- **Warning**: Naranja para alertas
- **Danger**: Rojo para errores/cancelaciones
- **Gray**: Escala de grises para texto y fondos

### Tipografía
- **Font**: Inter (Google Fonts)
- **Tamaños**:
  - Títulos H1: `text-3xl font-bold`
  - Cards: `text-2xl font-bold`
  - Texto normal: `text-sm`

### Espaciado
- **Padding contenedor**: `p-6`
- **Gap entre elementos**: `gap-4` o `gap-6`
- **Bordes**: `rounded-lg` o `rounded-xl`

## 📱 Responsive

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Comportamiento
- **Mobile**: Sidebar como drawer, grid 1 columna
- **Tablet**: Grid 2 columnas
- **Desktop**: Sidebar fijo, grid 3-4 columnas

## 🔄 Estados

### Ventas
- ✅ Completado (verde)
- ⏳ Pendiente (amarillo)
- ❌ Cancelado (rojo)

### Productos
- ✅ Activo (verde)
- ⚠️ Bajo Stock (naranja)

## 🚀 Próximas Funcionalidades

Para convertir en sistema real:

1. **Backend Integration**
   - Conectar con API REST
   - Autenticación JWT
   - WebSockets para updates en tiempo real

2. **Base de Datos**
   - PostgreSQL con Prisma
   - Migraciones
   - Seeders

3. **Funcionalidades Avanzadas**
   - Búsqueda global funcional
   - Filtros avanzados
   - Exportación real (PDF, Excel)
   - Gráficos con Chart.js o Recharts
   - Drag & Drop para ordenar
   - Paginación

4. **Seguridad**
   - Roles y permisos
   - 2FA
   - Logs de auditoría

## 📝 Uso

### Navegar al Dashboard
```
http://localhost:3000/dashboard
```

### Estructura de Rutas
```
/dashboard              → Inicio
/dashboard/ventas       → Ventas
/dashboard/inventario   → Inventario
/dashboard/clientes     → Clientes
/dashboard/proveedores  → Proveedores
/dashboard/caja         → Caja
/dashboard/reportes     → Reportes
/dashboard/configuracion → Configuración
```

### Agregar Nueva Página

1. Crear archivo en `app/dashboard/[nombre]/page.tsx`
2. Agregar ruta en `components/dashboard/sidebar.tsx`
3. Usar componentes reutilizables

Ejemplo:
```tsx
"use client";

import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";

export default function MiPagina() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mi Página</h1>
      {/* Contenido */}
    </div>
  );
}
```

## 🎯 Tips de Desarrollo

1. **Reutilizar componentes**: Usar `DataTable`, `Modal`, `KPICard`
2. **Datos mock**: Agregar en `lib/mock-data.ts`
3. **Colores consistentes**: Usar las clases de Tailwind definidas
4. **Icons**: Usar Lucide React
5. **Formularios**: Mantener estructura consistente
