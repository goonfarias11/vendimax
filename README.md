# VendiMax - Sistema POS Moderno

![VendiMax](https://img.shields.io/badge/VendiMax-POS%20System-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

Sistema de punto de venta moderno y eficiente construido con las últimas tecnologías web.

## 🚀 Características

- ✨ **Diseño Moderno**: Interfaz limpia y profesional con Tailwind CSS
- ⚡ **Rendimiento Óptimo**: Construido con Next.js 16 y App Router
- 🎨 **Componentes Reutilizables**: Librería de componentes basada en shadcn/ui
- 📱 **Responsive**: Diseño adaptable a todos los dispositivos
- 🔒 **TypeScript**: Código tipado y seguro
- 🎭 **Animaciones**: Transiciones suaves con Framer Motion
- 🎯 **SEO Optimizado**: Metadata configurada para mejor posicionamiento
- 🔐 **Autenticación Real**: NextAuth v5 con Prisma y bcrypt
- 🗄️ **Base de Datos**: PostgreSQL con Prisma ORM
- 👥 **Gestión de Usuarios**: Roles (Admin, Vendedor, Cajero, Gerente)
- 🛡️ **Rutas Protegidas**: Middleware de seguridad

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 3.4
- **Componentes**: shadcn/ui + Radix UI
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React
- **Fuente**: Inter (Google Fonts)
- **Autenticación**: NextAuth v5
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Seguridad**: bcrypt para hash de contraseñas

## 📁 Estructura del Proyecto

```
vendimax/
├── app/                    # App Router de Next.js
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth handlers
│   │   ├── cron/         # Cron jobs (verificación de trials)
│   │   └── register/     # Registro de usuarios
│   ├── dashboard/         # Páginas del dashboard (protegidas)
│   │   ├── ventas/
│   │   ├── inventario/
│   │   ├── clientes/
│   │   ├── proveedores/
│   │   ├── caja/
│   │   └── suscripcion/  # Gestión de suscripciones
│   │   ├── reportes/
│   │   └── configuracion/
│   ├── login/            # Página de login
│   ├── registro/         # Página de registro
│   ├── layout.tsx        # Layout principal
│   ├── page.tsx          # Landing page
│   └── globals.css       # Estilos globales
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   │   ├── button.tsx
│   │   └── card.tsx
│   ├── dashboard/        # Componentes del dashboard
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   ├── kpi-card.tsx
│   │   ├── data-table.tsx
│   │   ├── modal.tsx
│   │   └── simple-chart.tsx
│   ├── session-provider.tsx
│   ├── navbar.tsx        # Barra de navegación
│   ├── hero-section.tsx  # Sección hero
│   ├── beneficios-section.tsx
│   ├── funciones-section.tsx
│   ├── precios-section.tsx
│   ├── dashboard-demo.tsx
│   └── footer.tsx
├── lib/                   # Utilidades y configuración
│   ├── auth.ts           # Configuración de NextAuth
│   ├── prisma.ts         # Cliente de Prisma
│   ├── mock-data.ts      # Datos de prueba
│   ├── utils.ts          # Funciones auxiliares
│   └── config.ts         # Configuración SEO
├── prisma/               # Base de datos
│   ├── schema.prisma     # Esquema de DB
│   ├── seed.ts           # Datos iniciales
│   └── migrations/       # Migraciones
├── types/                # Tipos TypeScript
│   └── next-auth.d.ts    # Types de NextAuth
├── middleware.ts         # Protección de rutas
└── public/               # Archivos estáticos
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm, yarn, pnpm o bun
- PostgreSQL 14+

### Instalación

1. Clonar o navegar al proyecto

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:

Crear archivo `.env` en la raíz:
```env
# Database
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/vendimax"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-super-seguro-cambiame-en-produccion"
```

4. Crear base de datos PostgreSQL:
```sql
CREATE DATABASE vendimax;
```

5. Aplicar schema a la base de datos:
```bash
npm run db:push
```

6. Poblar con datos iniciales:
```bash
npm run db:seed
```

7. Ejecutar en desarrollo:
```bash
npm run dev
```

8. Abrir [http://localhost:3000](http://localhost:3000)

### 👤 Usuarios de Prueba

Después del seed, puedes usar estas credenciales:

| Email                 | Contraseña  | Rol      |
|-----------------------|-------------|----------|
| admin@vendimax.com    | admin123    | ADMIN    |
| vendedor@vendimax.com | vendedor123 | VENDEDOR |

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Base de Datos
npm run db:generate  # Genera Prisma Client
npm run db:push      # Aplica schema a la DB
npm run db:seed      # Pobla DB con datos de prueba
npm run db:studio    # Abre Prisma Studio (UI de DB)

# Producción
npm run build        # Construye la aplicación para producción
npm start            # Inicia el servidor de producción
npm run lint         # Ejecuta el linter
```

## 🎨 Paleta de Colores

- **Primary**: Azul (#3B82F6) - Botones principales y acentos
- **Secondary**: Gris claro - Elementos secundarios
- **Background**: Blanco y grises suaves
- **Text**: Grises oscuros para lectura óptima

## 🔧 Configuración

### Tailwind CSS

El archivo `tailwind.config.ts` incluye:
- Sistema de diseño basado en variables CSS
- Tema personalizado con colores de marca
- Configuración de fuente Inter

### Metadata SEO

Configuración en `lib/config.ts`:
- Título y descripción del sitio
- Open Graph tags
- Twitter Cards
- Keywords optimizadas

## 📄 Páginas Incluidas

- **/** - Landing page completa
- **/login** - Página de inicio de sesión
- **/registro** - Página de registro
## 📚 Documentación Adicional

- [📖 Componentes del Dashboard](./DASHBOARD.md)
- [🔐 Sistema de Autenticación](./AUTENTICACION.md)
- [🚀 Guía de Deployment](./DEPLOYMENT.md)
- [🧩 Componentes Reutilizables](./COMPONENTES.md)

## 🗺️ Rutas de la Aplicación

### Públicas
- **/** - Landing page del sistema
- **/login** - Página de inicio de sesión
- **/registro** - Página de registro de usuarios

### Protegidas (requieren autenticación)
- **/dashboard** - Dashboard principal con KPIs
- **/dashboard/ventas** - Gestión de ventas
- **/dashboard/inventario** - Control de inventario
- **/dashboard/clientes** - Gestión de clientes
- **/dashboard/proveedores** - Gestión de proveedores
- **/dashboard/caja** - Movimientos de caja
- **/dashboard/reportes** - Reportes y análisis
- **/dashboard/configuracion** - Configuración del sistema
- **/dashboard/suscripcion** - Gestión de planes y suscripciones

## 💳 Sistema de Suscripciones

VendiMax incluye un sistema completo de suscripciones con:

### Prueba Gratuita de 7 Días
- ✅ Al registrarse, los usuarios obtienen **7 días gratis** del plan PRO
- ✅ **3 días antes** de expirar reciben email recordatorio
- ✅ Al expirar, se **degrada automáticamente a plan FREE** (sin bloquear)
- ✅ Pueden actualizar a plan pago en cualquier momento

### Planes Disponibles
- **FREE**: 50 productos, 100 ventas/mes, 1 usuario
- **BÁSICO**: 1,000 productos, 5,000 ventas/mes
- **PYME**: 5,000 productos, 10,000 ventas/mes
- **EMPRESA**: Productos y ventas ilimitados

### Gestión Automática de Trials
El sistema incluye un **cron job** que se ejecuta diariamente para:
- Detectar trials que están por expirar (3 días antes)
- Enviar notificaciones por email
- Degradar automáticamente a plan FREE cuando expiran
- Permitir continuar usando el sistema con funcionalidad reducida

Ver documentación completa: [docs/TRIAL_MANAGEMENT.md](docs/TRIAL_MANAGEMENT.md)

## 🎯 Próximos Pasos

### Backend Real
- [ ] API endpoints con Next.js Route Handlers
- [ ] Validaciones con Zod
- [ ] Paginación y filtros avanzados
- [ ] Upload de imágenes de productos

### Funcionalidades Avanzadas
- [ ] Impresión de tickets de venta
- [ ] Exportación a PDF/Excel
- [ ] Gráficos interactivos con Recharts
- [ ] Notificaciones en tiempo real
- [ ] Multi-sucursal
- [ ] Modo offline (PWA)

### Integraciones
- [ ] Pasarelas de pago (Stripe, MercadoPago)
- [ ] Facturación electrónica
- [ ] WhatsApp Business API
- [ ] Integración con impresoras térmicas

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autor

**VendiMax Team**

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!

