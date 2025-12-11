# VendiMax - Sistema POS Completo

## 📋 Descripción General
VendiMax es un sistema Point of Sale (POS) completo desarrollado con Next.js 15, TypeScript, Prisma y PostgreSQL. Incluye gestión de ventas, productos, clientes, caja y cierre de caja.

## 🛠 Stack Tecnológico

### Frontend
- **Framework**: Next.js 15.1.3 (App Router)
- **Lenguaje**: TypeScript 5.x
- **UI**: Tailwind CSS + shadcn/ui
- **Iconos**: Lucide React
- **Validación**: Zod 3.x

### Backend
- **Runtime**: Node.js
- **ORM**: Prisma 6.19.0
- **Base de datos**: PostgreSQL (Neon)
- **Autenticación**: NextAuth v5
- **Rate Limiting**: Implementado

### Deployment
- **Plataforma**: Vercel
- **URL**: https://y-jdt6rlc15-goonfarias11s-projects.vercel.app

## 📁 Estructura del Proyecto

```
vendimax/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── sales/route.ts (GET/POST ventas)
│   │   ├── products/route.ts (CRUD productos)
│   │   ├── clients/route.ts (CRUD clientes)
│   │   ├── cash/close/route.ts (Cierre de caja)
│   │   └── cash-movements/route.ts (Movimientos de caja)
│   ├── dashboard/
│   │   ├── page.tsx (Dashboard principal)
│   │   ├── ventas/
│   │   │   ├── page.tsx (Lista de ventas)
│   │   │   └── nueva/page.tsx (Nueva venta)
│   │   ├── productos/page.tsx
│   │   ├── clientes/page.tsx
│   │   └── caja/page.tsx
│   ├── layout.tsx
│   └── page.tsx (Landing page)
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── data-table.tsx
│   │   └── close-cash-register-dialog.tsx
│   └── ui/ (shadcn components)
├── lib/
│   ├── auth.ts (NextAuth config)
│   ├── prisma.ts (Prisma client)
│   ├── validations.ts (Esquemas Zod)
│   ├── cashClosing.ts (Lógica cierre de caja)
│   ├── logger.ts
│   └── rateLimit.ts
├── hooks/
│   └── useCloseCashRegister.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── public/
```

## 🗄 Modelos de Base de Datos

### User
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String
  image         String?
  role          UserRole  @default(SELLER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sales         Sale[]
  cashClosings  CashClosing[]
}

enum UserRole {
  ADMIN
  SELLER
}
```

### Product
```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  cost        Decimal  @db.Decimal(10, 2)
  stock       Decimal  @db.Decimal(10, 2)
  minStock    Decimal  @db.Decimal(10, 2)
  category    String?
  barcode     String?  @unique
  image       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  saleItems   SaleItem[]
}
```

### Client
```prisma
model Client {
  id        String   @id @default(cuid())
  name      String
  email     String?  @unique
  phone     String?
  address   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  sales     Sale[]
}
```

### Sale
```prisma
model Sale {
  id             String        @id @default(cuid())
  number         Int           @unique @default(autoincrement())
  clientId       String
  userId         String
  paymentMethod  PaymentMethod
  total          Decimal       @db.Decimal(10, 2)
  subtotal       Decimal       @db.Decimal(10, 2)
  tax            Decimal       @db.Decimal(10, 2) @default(0)
  discount       Decimal       @db.Decimal(10, 2) @default(0)
  cashClosingId  String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  client         Client        @relation(fields: [clientId], references: [id])
  user           User          @relation(fields: [userId], references: [id])
  cashClosing    CashClosing?  @relation(fields: [cashClosingId], references: [id])
  saleItems      SaleItem[]
}

enum PaymentMethod {
  EFECTIVO
  TARJETA_DEBITO
  TARJETA_CREDITO
  TRANSFERENCIA
  QR
  OTRO
}
```

### CashClosing
```prisma
model CashClosing {
  id                    String   @id @default(cuid())
  number                Int      @unique @default(autoincrement())
  from                  DateTime
  to                    DateTime
  responsibleId         String
  totalEfectivo         Decimal  @db.Decimal(10, 2) @default(0)
  totalTarjetaDebito    Decimal  @db.Decimal(10, 2) @default(0)
  totalTarjetaCredito   Decimal  @db.Decimal(10, 2) @default(0)
  totalTransferencia    Decimal  @db.Decimal(10, 2) @default(0)
  totalQR               Decimal  @db.Decimal(10, 2) @default(0)
  totalOtro             Decimal  @db.Decimal(10, 2) @default(0)
  totalGeneral          Decimal  @db.Decimal(10, 2) @default(0)
  salesCount            Int      @default(0)
  observations          String?
  createdAt             DateTime @default(now())
  
  responsible           User     @relation(fields: [responsibleId], references: [id])
  sales                 Sale[]
}
```

### CashMovement
```prisma
model CashMovement {
  id          String           @id @default(cuid())
  type        CashMovementType
  amount      Decimal          @db.Decimal(10, 2)
  description String
  createdAt   DateTime         @default(now())
}

enum CashMovementType {
  INGRESO
  EGRESO
}
```

## 🔑 Características Principales

### 1. Autenticación
- NextAuth v5 con credentials provider
- Roles: ADMIN y SELLER
- Protección de rutas en `/dashboard`

### 2. Gestión de Ventas
- Crear nueva venta con múltiples productos
- Selección de cliente (existente o nuevo)
- 6 métodos de pago
- Actualización automática de stock
- Validación de stock disponible
- Conversión correcta de tipos Decimal → Number

### 3. Gestión de Productos
- CRUD completo
- Control de stock
- Stock mínimo
- Categorías
- Código de barras
- Imágenes

### 4. Gestión de Clientes
- CRUD completo
- Creación rápida desde nueva venta
- Email único opcional

### 5. Cierre de Caja
- **Vista previa** antes de cerrar
- Totales por método de pago
- Rango de fechas del cierre
- Número de cierre auto-incremental
- Observaciones opcionales
- Validaciones:
  - No permitir cerrar sin ventas
  - No permitir periodos superpuestos
  - Verificar totales

### 6. Movimientos de Caja
- Registro de ingresos/egresos
- Consulta de saldo actual

## 🔧 Configuración

### Variables de Entorno (.env)
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-generado"

# Auth.js v5
AUTH_SECRET="tu-secret-generado"
```

### Instalación
```bash
# Instalar dependencias
npm install

# Ejecutar migraciones
npx prisma migrate deploy

# Generar Prisma Client
npx prisma generate

# Iniciar en desarrollo
npm run dev

# Build para producción
npm run build

# Desplegar a Vercel
vercel --prod
```

## 📊 API Endpoints

### Ventas
- `GET /api/sales` - Lista todas las ventas (con relaciones)
- `POST /api/sales` - Crear nueva venta
  - Body: `{ clientId, paymentMethod, items: [{ productId, quantity, price }] }`

### Productos
- `GET /api/products` - Lista productos activos
- `POST /api/products` - Crear producto
- `PUT /api/products` - Actualizar producto
- `DELETE /api/products` - Eliminar producto (soft delete)

### Clientes
- `GET /api/clients` - Lista clientes activos
- `POST /api/clients` - Crear cliente
- `PUT /api/clients` - Actualizar cliente
- `DELETE /api/clients` - Eliminar cliente (soft delete)

### Cierre de Caja
- `GET /api/cash/close` - Obtener preview del próximo cierre
- `POST /api/cash/close` - Crear cierre de caja
  - Body: `{ observations?: string }`

### Movimientos de Caja
- `GET /api/cash-movements` - Lista movimientos
- `POST /api/cash-movements` - Crear movimiento
  - Body: `{ type, amount, description }`

## 🎯 Validaciones con Zod

### createSaleSchema
```typescript
z.object({
  clientId: z.string().cuid(),
  paymentMethod: z.enum(["EFECTIVO", "TARJETA_DEBITO", "TARJETA_CREDITO", "TRANSFERENCIA", "QR", "OTRO"]),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.coerce.number().int().positive(),
      price: z.coerce.number().positive()
    })
  ).min(1)
})
```

### createProductSchema
```typescript
z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  cost: z.coerce.number().positive(),
  stock: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0),
  category: z.string().optional(),
  barcode: z.string().optional()
})
```

## 🐛 Problemas Resueltos

### 1. Conversión Decimal → Number
**Problema**: Prisma devuelve `Decimal` como string en JSON, causando errores de validación.

**Solución**: Convertir explícitamente en:
- APIs (GET): `Number(value)` antes de enviar
- Validaciones: `z.coerce.number()` en schemas
- Frontend: `Number(value)` al agregar al carrito

### 2. Enum PaymentMethod
**Problema**: Frontend enviaba "TARJETA" pero enum requiere "TARJETA_DEBITO" o "TARJETA_CREDITO".

**Solución**: Actualizar frontend para usar los 6 valores correctos del enum.

### 3. NextAuth v5 API Changes
**Problema**: `getServerSession` no existe en v5.

**Solución**: Usar `auth()` directamente desde `lib/auth.ts`.

## 📝 Migraciones Aplicadas

1. `20241130000000_init` - Estructura inicial
2. `20241205000000_add_user_role` - Agregado campo role a User
3. `20251208153912_add_cash_closing` - Sistema completo de cierre de caja

## 🚀 Estado Actual

### ✅ Completado
- Autenticación funcional
- CRUD de productos, clientes, ventas
- Sistema de cierre de caja completo
- Conversiones Decimal correctas
- Validaciones Zod con coerce
- UI profesional con shadcn/ui
- Desplegado en Vercel

### 🔄 En Revisión
- Lista de ventas mostrando datos reales (con logs de debug agregados)

### 📋 Pendiente
- Sistema de reportes
- Dashboard con gráficas
- Exportación a PDF/Excel
- Manejo de devoluciones
- Multi-sucursales

## 📚 Documentación Adicional

Ver archivos:
- `CIERRE-CAJA-DOCS.md` - Documentación completa del sistema de cierre de caja
- `ESTRUCTURA.md` - Estructura detallada del proyecto

## 🔗 URLs Importantes

- **Producción**: https://y-jdt6rlc15-goonfarias11s-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/goonfarias11s-projects/y
- **Base de datos**: Neon PostgreSQL

## 👤 Usuario de Prueba

Crear desde la UI de registro o directamente en la base de datos.

---

**Última actualización**: 9 de diciembre de 2025
**Versión**: 1.0.0
