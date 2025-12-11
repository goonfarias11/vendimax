# 🔍 Análisis Técnico Completo - VendiMax POS

**Fecha:** 8 de diciembre de 2025  
**Analista:** Senior Full-Stack Developer  
**Framework:** Next.js 16 + TypeScript + Prisma + NextAuth v5

---

## 📋 RESUMEN EJECUTIVO

### ✅ Puntos Fuertes
- ✅ Estructura de carpetas bien organizada (App Router)
- ✅ TypeScript correctamente configurado
- ✅ Prisma schema completo y normalizado
- ✅ NextAuth v5 con JWT y bcrypt
- ✅ API routes con runtime nodejs (evita edge runtime)
- ✅ Componentes reutilizables con shadcn/ui
- ✅ Transacciones de Prisma en operaciones críticas

### ⚠️ Problemas Críticos Encontrados
1. **Dashboard con loading infinito potencial**
2. **Falta de manejo de errores en componentes cliente**
3. **Sin estados de loading/error en llamadas API**
4. **Middleware eliminado - protección solo client-side**
5. **Sin rate limiting en APIs**
6. **Sin validación de tipos en APIs**
7. **Logs de debug en producción**
8. **Sin sistema de cache**
9. **Sin optimización de imágenes**
10. **Falta implementación de módulos clave**

---

## 🐛 PROBLEMAS DETALLADOS

### 🔴 CRÍTICO 1: Dashboard Loading Infinito

**Archivo:** `app/dashboard/layout.tsx`

**Problema:**
```tsx
useEffect(() => {
  if (status === "unauthenticated") {
    router.push("/login");
  }
}, [status, router]);

if (status === "loading") {
  return <div>Cargando...</div>; // ❌ Puede quedar cargando por siempre
}
```

**Causas:**
- Si `useSession()` falla por error de red → status queda en "loading"
- Si la sesión expira pero el token JWT está corrupto → loop
- No hay timeout de seguridad
- No hay manejo de error de sesión

**Solución:**
```tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Timeout de seguridad para loading infinito
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "loading") {
        setLoadingTimeout(true);
      }
    }, 10000); // 10 segundos máximo

    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Error de timeout
  if (loadingTimeout && status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error de Conexión
          </h1>
          <p className="text-gray-600 mb-6">
            No se pudo cargar la sesión. Por favor, intenta nuevamente.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  // Estado de carga normal
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Cargando sesión...</p>
          <p className="text-gray-400 text-sm mt-2">Por favor espera</p>
        </div>
      </div>
    );
  }

  // Sin sesión (ya redirigiendo)
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="md:pl-64">
        <DashboardTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

---

### 🔴 CRÍTICO 2: APIs sin Validación de Tipos

**Problema:** Todas las APIs reciben `any` y no validan inputs

**Archivo:** `app/api/sales/route.ts`
```tsx
const body = await request.json() // ❌ any type
const { clientId, paymentMethod, items } = body // ❌ no validation
```

**Solución:** Usar Zod para validación

```bash
npm install zod
```

**Crear:** `lib/validations.ts`
```typescript
import { z } from "zod"

export const createSaleSchema = z.object({
  clientId: z.string().cuid(),
  paymentMethod: z.enum(["EFECTIVO", "TARJETA_DEBITO", "TARJETA_CREDITO", "TRANSFERENCIA", "QR", "OTRO"]),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive(),
      price: z.number().positive()
    })
  ).min(1, "Debe haber al menos un producto")
})

export const createClientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().min(8).optional().nullable(),
  address: z.string().optional().nullable()
})

export const registerUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["ADMIN", "VENDEDOR", "CAJERO", "GERENTE"]).optional()
})
```

**Actualizar:** `app/api/sales/route.ts`
```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createSaleSchema } from "@/lib/validations"
import { ZodError } from "zod"

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar con Zod
    const validatedData = createSaleSchema.parse(body)
    
    const { clientId, paymentMethod, items } = validatedData

    // Calcular total
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
    const total = subtotal

    // Verificar stock antes de crear la venta
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Producto ${item.productId} no encontrado` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` },
          { status: 400 }
        )
      }
    }

    // Crear venta con transacción
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          clientId,
          userId: session.user.id,
          total,
          subtotal,
          tax: 0,
          discount: 0,
          paymentMethod,
          status: "COMPLETADO"
        }
      })

      for (const item of items) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
          }
        })

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      await tx.cashMovement.create({
        data: {
          userId: session.user.id,
          type: "INGRESO",
          amount: total,
          description: `Venta #${newSale.id} - ${paymentMethod}`,
          reference: newSale.id
        }
      })

      return newSale
    }, {
      timeout: 10000, // 10 segundos timeout
      maxWait: 5000 // Máximo 5 segundos esperando lock
    })

    return NextResponse.json(sale, { status: 201 })
    
  } catch (error: any) {
    console.error("Error creating sale:", error)
    
    // Manejo de errores de Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: "Datos inválidos",
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    // Errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Ya existe un registro con esos datos" },
        { status: 409 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Error al crear la venta" },
      { status: 500 }
    )
  }
}
```

---

### 🔴 CRÍTICO 3: Sin Manejo de Estados en Frontend

**Problema:** Las llamadas API no muestran loading ni manejan errores

**Archivo:** `app/dashboard/ventas/nueva/page.tsx`

**Actual:**
```tsx
// Cargar productos
useEffect(() => {
  fetch("/api/products")
    .then(res => res.json())
    .then(data => setProducts(data))
    .catch(err => console.error("Error cargando productos:", err)) // ❌ solo console
}, [])
```

**Solución:** Crear hook personalizado con estados

**Crear:** `hooks/use-api.ts`
```typescript
import { useState, useEffect } from 'react'

interface UseApiOptions<T> {
  url: string
  initialData?: T
  enabled?: boolean
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useApi<T = any>({
  url,
  initialData = null,
  enabled = true
}: UseApiOptions<T>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [url, enabled])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}
```

**Actualizar:** `app/dashboard/ventas/nueva/page.tsx`
```tsx
import { useApi } from "@/hooks/use-api"

export default function NuevaVentaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  
  // Estados con hook personalizado
  const { 
    data: products, 
    loading: loadingProducts, 
    error: errorProducts,
    refetch: refetchProducts 
  } = useApi<Product[]>({ url: "/api/products" })

  const { 
    data: clients, 
    loading: loadingClients, 
    error: errorClients 
  } = useApi<Client[]>({ url: "/api/clients" })

  // UI con estados de loading/error
  if (loadingProducts || loadingClients) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (errorProducts || errorClients) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error al cargar</h3>
          <p className="text-red-600 text-sm mb-4">
            {errorProducts || errorClients}
          </p>
          <button
            onClick={() => {
              refetchProducts()
              window.location.reload()
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Resto del componente...
}
```

---

### 🔴 CRÍTICO 4: Logs de Debug en Producción

**Problema:** `lib/auth.ts` tiene console.log en producción

```typescript
console.log("🔐 Intentando autenticar:", credentials?.email) // ❌
console.error("❌ Usuario no encontrado:", credentials.email) // ❌
```

**Solución:** Crear logger condicional

**Crear:** `lib/logger.ts`
```typescript
type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class Logger {
  private isDev = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (!this.isDev && level === 'debug') return

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    switch (level) {
      case 'error':
        console.error(prefix, message, ...args)
        break
      case 'warn':
        console.warn(prefix, message, ...args)
        break
      default:
        console.log(prefix, message, ...args)
    }
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args)
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args)
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args)
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args)
  }
}

export const logger = new Logger()
```

**Actualizar:** `lib/auth.ts`
```typescript
import { logger } from "@/lib/logger"

async authorize(credentials) {
  try {
    logger.debug("Intentando autenticar:", credentials?.email)
    
    // ... código ...
    
    logger.debug("Autenticación exitosa para:", user.email)
    return user
  } catch (error) {
    logger.error("Error en authorize:", error)
    return null
  }
}
```

---

### 🟡 IMPORTANTE: Sin Rate Limiting

**Problema:** APIs sin protección contra ataques de fuerza bruta

**Solución:** Implementar rate limiting

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Crear:** `lib/rate-limit.ts`
```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Crear cliente Redis (usar Upstash Redis gratis)
const redis = Redis.fromEnv()

// Rate limiter para autenticación (5 intentos por 15 minutos)
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "auth",
})

// Rate limiter para APIs generales (30 requests por minuto)
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "api",
})

// Rate limiter para creación de ventas (10 por minuto)
export const salesRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "sales",
})
```

**Actualizar:** `app/api/auth/[...nextauth]/route.ts`
```typescript
import { handlers } from "@/lib/auth"
import { authRateLimit } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'

async function handleRequest(req: NextRequest, handler: any) {
  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "127.0.0.1"
  
  const { success, limit, reset, remaining } = await authRateLimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo más tarde." },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(reset).toISOString(),
        }
      }
    )
  }

  return handler(req)
}

export async function GET(req: NextRequest) {
  return handleRequest(req, handlers.GET)
}

export async function POST(req: NextRequest) {
  return handleRequest(req, handlers.POST)
}
```

---

## 📦 ARQUITECTURA IDEAL

### Estructura Recomendada

```
vendimax/
├── 📁 app/
│   ├── (auth)/              # Grupo de rutas de autenticación
│   │   ├── layout.tsx       # Layout compartido auth
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── registro/
│   │       └── page.tsx
│   │
│   ├── (marketing)/         # Grupo de rutas públicas
│   │   ├── layout.tsx
│   │   └── page.tsx         # Landing
│   │
│   ├── (dashboard)/         # Grupo de rutas protegidas
│   │   ├── layout.tsx       # Layout con auth
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── ventas/
│   │       │   ├── page.tsx
│   │       │   ├── nueva/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── inventario/
│   │       ├── clientes/
│   │       ├── proveedores/
│   │       ├── caja/
│   │       ├── reportes/
│   │       └── configuracion/
│   │
│   └── api/
│       ├── auth/
│       ├── sales/
│       ├── products/
│       ├── clients/
│       └── suppliers/
│
├── 📁 components/
│   ├── ui/                  # shadcn/ui base
│   ├── dashboard/           # Componentes de dashboard
│   ├── forms/               # Formularios reutilizables
│   ├── modals/              # Modales
│   └── providers/           # Context providers
│
├── 📁 lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── rate-limit.ts
│   ├── logger.ts
│   ├── validations.ts       # Esquemas Zod
│   ├── utils.ts
│   └── constants.ts
│
├── 📁 hooks/
│   ├── use-api.ts
│   ├── use-toast.ts
│   ├── use-products.ts
│   └── use-sales.ts
│
├── 📁 types/
│   ├── next-auth.d.ts
│   ├── database.ts
│   └── api.ts
│
└── 📁 prisma/
    ├── schema.prisma
    ├── seed.ts
    └── migrations/
```

---

## 🎨 MEJORAS UX/UI con shadcn/ui

### 1. Toast Notifications

```bash
npx shadcn@latest add toast
```

**Crear:** `components/providers/toast-provider.tsx`
```tsx
"use client"

import { Toaster } from "@/components/ui/toaster"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}
```

**Usar en ventas:**
```tsx
import { useToast } from "@/hooks/use-toast"

export default function NuevaVentaPage() {
  const { toast } = useToast()

  const handleSubmit = async () => {
    try {
      // ... crear venta ...
      
      toast({
        title: "✅ Venta creada",
        description: `Venta #${sale.id} registrada exitosamente`,
        variant: "success"
      })
      
      router.push("/dashboard/ventas")
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }
}
```

### 2. Skeleton Loaders

```bash
npx shadcn@latest add skeleton
```

**Usar mientras cargan datos:**
```tsx
import { Skeleton } from "@/components/ui/skeleton"

if (loading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}
```

### 3. Command Palette (Búsqueda Global)

```bash
npx shadcn@latest add command
npx shadcn@latest add dialog
```

**Crear:** `components/dashboard/command-menu.tsx`
```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Search } from "lucide-react"

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
      >
        <Search className="w-4 h-4" />
        <span>Buscar...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-xs">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar productos, ventas, clientes..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup heading="Acciones rápidas">
            <CommandItem onSelect={() => router.push("/dashboard/ventas/nueva")}>
              Nueva Venta
            </CommandItem>
            <CommandItem onSelect={() => router.push("/dashboard/inventario")}>
              Ver Inventario
            </CommandItem>
            <CommandItem onSelect={() => router.push("/dashboard/clientes")}>
              Gestionar Clientes
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
```

---

## ⚡ OPTIMIZACIONES DE PERFORMANCE

### 1. Lazy Loading de Componentes

```tsx
import dynamic from 'next/dynamic'

// Cargar gráficos solo cuando sean necesarios
const SimpleBarChart = dynamic(
  () => import('@/components/dashboard/simple-chart').then(mod => mod.SimpleBarChart),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false
  }
)
```

### 2. React Query para Cache

```bash
npm install @tanstack/react-query
```

**Configurar:** `app/layout.tsx`
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minuto
      cacheTime: 5 * 60 * 1000, // 5 minutos
    },
  },
})

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            {children}
          </SessionProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

**Usar:**
```tsx
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const res = await fetch('/api/products')
    if (!res.ok) throw new Error('Error')
    return res.json()
  }
})
```

### 3. Optimizar Prisma Queries

**Problema:** N+1 queries

**Mal:**
```typescript
const sales = await prisma.sale.findMany()
// Para cada venta, hace otra query
for (const sale of sales) {
  const items = await prisma.saleItem.findMany({ where: { saleId: sale.id }})
}
```

**Bien:**
```typescript
const sales = await prisma.sale.findMany({
  include: {
    saleItems: {
      include: {
        product: {
          select: { name: true, sku: true }
        }
      }
    },
    client: {
      select: { name: true }
    },
    user: {
      select: { name: true }
    }
  },
  take: 50, // Limitar resultados
  orderBy: { createdAt: 'desc' }
})
```

---

## 🔒 MEJORAS DE SEGURIDAD

### 1. Variables de Entorno

**Crear:** `.env.example`
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Limits
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

### 2. Helmet para Headers de Seguridad

**Actualizar:** `next.config.ts`
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}
```

### 3. CSRF Protection

**Crear:** `lib/csrf.ts`
```typescript
import { cookies } from 'next/headers'
import crypto from 'crypto'

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function validateCSRFToken(token: string): boolean {
  const cookieStore = cookies()
  const storedToken = cookieStore.get('csrf-token')?.value
  return storedToken === token
}
```

---

## 📊 PLAN DE MIGRACIÓN

### Fase 1: Correcciones Críticas (1-2 días)
1. ✅ Arreglar dashboard loading infinito
2. ✅ Agregar validaciones Zod en todas las APIs
3. ✅ Implementar manejo de errores en frontend
4. ✅ Remover logs de debug en producción

### Fase 2: Mejoras de Seguridad (2-3 días)
1. ✅ Implementar rate limiting
2. ✅ Agregar CSRF protection
3. ✅ Configurar headers de seguridad
4. ✅ Auditoría de dependencias (npm audit)

### Fase 3: UX/Performance (3-4 días)
1. ✅ Implementar React Query
2. ✅ Agregar toast notifications
3. ✅ Crear command palette
4. ✅ Optimizar queries de Prisma
5. ✅ Lazy loading de componentes

### Fase 4: Features Faltantes (1 semana)
1. ✅ Módulo de Inventario completo
2. ✅ Módulo de Clientes completo
3. ✅ Módulo de Proveedores completo
4. ✅ Reportes con gráficos
5. ✅ Configuración de empresa
6. ✅ Gestión de usuarios

---

## ✅ CHECKLIST FINAL

### Seguridad
- [ ] Rate limiting implementado
- [ ] Validación Zod en todas las APIs
- [ ] CSRF protection
- [ ] Headers de seguridad
- [ ] Logs solo en desarrollo
- [ ] Variables de entorno documentadas

### Performance
- [ ] React Query configurado
- [ ] Lazy loading de componentes pesados
- [ ] Prisma queries optimizadas
- [ ] Cache de datos estáticos
- [ ] Imágenes optimizadas con next/image

### UX/UI
- [ ] Toast notifications
- [ ] Skeleton loaders
- [ ] Estados de error manejados
- [ ] Loading states en todas las acciones
- [ ] Command palette
- [ ] Formularios con validación visual

### Testing
- [ ] Unit tests para utilities
- [ ] Integration tests para APIs
- [ ] E2E tests para flujos críticos

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Ahora mismo:**
   - Implementar timeout en dashboard layout
   - Agregar Zod validations
   - Crear hook useApi

2. **Esta semana:**
   - Implementar rate limiting
   - Agregar toast notifications
   - Completar módulos faltantes

3. **Próximo sprint:**
   - Implementar React Query
   - Crear tests automatizados
   - Optimizar performance

---

**¿Quieres que implemente alguna de estas mejoras ahora?**
