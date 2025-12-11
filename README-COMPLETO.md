# 🏪 VendiMax - Sistema POS SaaS Completo

![VendiMax](https://img.shields.io/badge/VendiMax-POS%20SaaS-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

Sistema de Punto de Venta (POS) completo, listo para producción, con modelo de suscripciones SaaS, facturación, reportes avanzados y mucho más.

---

## 🌟 Características Principales

### 💼 Funcionalidades de Negocio

- ✅ **Ventas Rápidas**: Interfaz optimizada para procesar ventas en 3 clics
- 📦 **Gestión de Inventario**: CRUD completo de productos con alertas de stock
- 👥 **Gestión de Clientes**: CRM integrado con historial de compras
- 💰 **Caja y Cierre**: Control completo de movimientos y cierres diarios
- 📊 **Reportes Avanzados**: Analytics de ventas, productos y rendimiento
- 🏢 **Multi-sucursal**: Gestión de múltiples locales (Plan Pro+)
- 📜 **Facturación**: Tickets y facturación electrónica AFIP

### 🚀 Características Técnicas

- ⚡ **Performance**: Next.js 16 con Turbopack y optimizaciones SSR
- 🔐 **Seguridad**: Autenticación NextAuth v5, sanitización, rate limiting
- 💳 **Suscripciones**: Integración completa con Stripe y MercadoPago
- 🎨 **UI Moderna**: Tailwind CSS + shadcn/ui components
- 📱 **Responsive**: Diseño adaptativo mobile-first
- 🔄 **Real-time**: Datos en tiempo real con React Query
- 🧪 **Demo en Vivo**: Entorno de prueba sin registro

---

## 📋 Planes y Precios

| Característica | Free | Starter | Pro | Enterprise |
|---------------|------|---------|-----|------------|
| Precio | $0 | $8,500/mes | $14,000/mes | $22,000/mes |
| Productos | 100 | 1,000 | Ilimitado | Ilimitado |
| Ventas/mes | 50 | 500 | Ilimitadas | Ilimitadas |
| Usuarios | 1 | 3 | 10 | Ilimitados |
| Multi-sucursal | ❌ | ❌ | ✅ | ✅ |
| Reportes Avanzados | ❌ | ✅ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ | ✅ |
| Facturación AFIP | ❌ | ✅ | ✅ | ✅ |
| Soporte | Email | WhatsApp | 24/7 | Dedicado |

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 16.0.7 (App Router + Turbopack)
- **Lenguaje**: TypeScript 5.x
- **UI Library**: React 19.2
- **Estilos**: Tailwind CSS 3.4
- **Componentes**: shadcn/ui + Radix UI
- **Animaciones**: Framer Motion 12
- **State**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (Edge Runtime compatible)
- **API**: Next.js API Routes + Server Actions
- **Base de Datos**: PostgreSQL (Neon/Supabase)
- **ORM**: Prisma 6.19
- **Autenticación**: NextAuth v5
- **Validación**: Zod 4.x

### Pagos & Suscripciones
- **Pasarelas**: Stripe + MercadoPago
- **Facturación**: AFIP SDK (Argentina)

### DevOps & Deploy
- **Hosting**: Vercel (recomendado)
- **CI/CD**: GitHub Actions / Vercel Auto-deploy
- **Monitoreo**: Sentry (opcional)
- **Analytics**: Google Analytics 4 (opcional)

---

## 📁 Estructura del Proyecto

```
vendimax/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Grupo de rutas de autenticación
│   │   ├── login/
│   │   └── registro/
│   ├── dashboard/               # Dashboard (rutas protegidas)
│   │   ├── ventas/
│   │   ├── productos/
│   │   ├── clientes/
│   │   ├── caja/
│   │   ├── reportes/
│   │   └── ajustes/
│   ├── api/                     # API Routes
│   │   ├── auth/               # NextAuth handlers
│   │   ├── products/
│   │   ├── sales/
│   │   ├── clients/
│   │   ├── subscriptions/
│   │   ├── webhooks/           # Stripe/MP webhooks
│   │   └── demo/
│   ├── demo/                    # Página de demo público
│   ├── precios/                 # Planes y precios
│   ├── soporte/                 # Centro de ayuda
│   └── legal/                   # Términos y privacidad
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard/               # Componentes del dashboard
│   └── [sections]/              # Landing page sections
├── lib/
│   ├── auth.ts                  # Configuración NextAuth
│   ├── prisma.ts                # Cliente Prisma
│   ├── stripe.ts                # Configuración Stripe
│   ├── security.ts              # Utilidades de seguridad
│   ├── planLimits.ts            # Verificación de límites
│   ├── validations.ts           # Esquemas Zod
│   └── utils.ts
├── prisma/
│   ├── schema.prisma            # Modelos de base de datos
│   ├── migrations/              # Migraciones
│   └── seed.ts                  # Datos semilla
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
├── public/                       # Assets estáticos
├── middleware.ts                 # Security middleware
└── .env                          # Variables de entorno

```

---

## 🗄️ Modelos de Base de Datos

### Principales Modelos

- **Business**: Negocios/Empresas (multi-tenant)
- **Subscription**: Suscripciones y planes
- **User**: Usuarios con roles
- **Product**: Productos del inventario
- **Category**: Categorías de productos
- **Client**: Clientes
- **Sale**: Ventas
- **SaleItem**: Items de venta
- **CashClosing**: Cierres de caja
- **CashMovement**: Movimientos de caja
- **Supplier**: Proveedores
- **Purchase**: Compras
- **Invoice**: Facturas de suscripción

Ver `prisma/schema.prisma` para el esquema completo.

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 18+ y npm/pnpm
- PostgreSQL 14+ (local o remoto)
- Cuenta de Stripe (para suscripciones)
- Cuenta de Vercel (para deploy)

### 1. Clonar e Instalar

```bash
git clone https://github.com/tu-usuario/vendimax.git
cd vendimax
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Base de Datos
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_STARTER="price_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_ENTERPRISE="price_..."

# Demo
DEMO_RESET_KEY="clave-secreta-demo"
```

### 3. Configurar Base de Datos

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# (Opcional) Seed datos de prueba
npm run db:seed
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 📦 Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Build para producción
npm start            # Iniciar servidor producción
npm run lint         # Ejecutar ESLint
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Push schema sin migración
npm run db:seed      # Poblar base de datos
npm run db:studio    # Abrir Prisma Studio
```

---

## 🌐 Deploy a Producción

### Deploy en Vercel (Recomendado)

1. **Conecta tu repo a Vercel**
   ```bash
   vercel
   ```

2. **Configura variables de entorno**
   - DATABASE_URL (usar Neon o Supabase)
   - NEXTAUTH_URL (tu dominio de producción)
   - NEXTAUTH_SECRET
   - Todas las claves de Stripe

3. **Configura webhooks de Stripe**
   - URL: `https://tu-dominio.com/api/webhooks/stripe`
   - Eventos: `customer.subscription.*`, `invoice.*`

4. **Deploy**
   ```bash
   vercel --prod
   ```

### Deploy Alternativo (Docker)

```dockerfile
# Ver Dockerfile en el repositorio
docker build -t vendimax .
docker run -p 3000:3000 vendimax
```

---

## 🔐 Seguridad

✅ **Implementado**:
- NextAuth v5 con JWT sessions
- bcrypt para hash de contraseñas
- Sanitización de inputs (DOMPurify)
- Rate limiting en APIs
- Validación con Zod en todas las entradas
- Headers de seguridad (CSP, XSS Protection, etc.)
- HTTPS obligatorio en producción
- CSRF protection
- SQL Injection prevention (Prisma)

---

## 🧪 Entorno Demo

Accede al demo en vivo sin registro:

**URL**: [https://tu-dominio.com/demo](https://tu-dominio.com/demo)

**Credenciales**:
- Email: `demo@vendimax.com`
- Password: `demo123`

⚠️ **Nota**: El entorno demo se resetea cada 24 horas automáticamente.

---

## 📚 Documentación Adicional

- [Guía de Desarrollo](./DESARROLLO.md)
- [API Reference](./API.md)
- [Modelos de Base de Datos](./SCHEMA.md)
- [Guía de Despliegue](./DEPLOY.md)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push al branch (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](./LICENSE) para más detalles.

---

## 📞 Soporte

- 📧 Email: soporte@vendimax.com
- 💬 WhatsApp: +54 11 XXXX-XXXX
- 📖 Documentación: [docs.vendimax.com](https://docs.vendimax.com)
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/vendimax/issues)

---

## 🎯 Roadmap

- [x] Sistema de ventas básico
- [x] Gestión de inventario
- [x] Cierres de caja
- [x] Sistema de suscripciones
- [x] Entorno demo
- [ ] Facturación AFIP completa
- [ ] App móvil (React Native)
- [ ] Integración con hardware (impresoras, lectores)
- [ ] Sistema de fidelización
- [ ] Multi-moneda
- [ ] Exportación contable

---

**Hecho con ❤️ por el equipo de VendiMax**
