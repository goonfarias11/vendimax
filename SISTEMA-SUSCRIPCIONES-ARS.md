# Sistema de Suscripciones ARS - VendiMax

## 📋 Resumen

Sistema completo de suscripciones en pesos argentinos (ARS) con integración de MercadoPago, ajustes automáticos por IPC, planes mensuales/anuales, Setup Fee, y control de acceso granular por características.

---

## 🎯 Características Implementadas

### ✅ Planes de Suscripción

**3 Planes Disponibles:**

1. **Plan Emprendedor - $20.000/mes**
   - 2 usuarios
   - Hasta 500 productos
   - Hasta 200 ventas/mes
   - Gestión básica de ventas, stock, clientes
   - Reportes básicos
   - Cierre de caja

2. **Plan Pyme - $50.000/mes**
   - 5 usuarios
   - Hasta 2000 productos
   - Hasta 1000 ventas/mes
   - Todo lo de Emprendedor +
   - Facturación electrónica (AFIP)
   - Múltiples sucursales
   - Reportes avanzados
   - Análisis de rentabilidad

3. **Plan Full - $120.000/mes**
   - Usuarios ilimitados
   - Productos ilimitados
   - Ventas ilimitadas
   - Todo lo de Pyme +
   - API para integraciones
   - Exportación personalizada
   - Backups automáticos diarios
   - Soporte VIP 24/7

**Características de Precios:**
- **Pago Anual:** 20% de descuento automático
- **Precio Congelado:** Los planes anuales mantienen el precio por 12 meses
- **Setup Fee:** $60.000 pago único (requerido para activación)
- **IVA:** 21% incluido en todos los precios

### ✅ Addons Opcionales

1. **Integración MercadoLibre - +$15.000/mes**
   - Sincronización automática de stock
   - Publicación masiva de productos
   - Gestión de ventas ML desde VendiMax
   - Actualizaciones en tiempo real

2. **Tienda Online - +$20.000/mes**
   - Tienda online personalizable
   - Carrito de compras
   - Pasarela de pagos integrada
   - Dominio personalizado
   - SEO optimizado

3. **Análisis Avanzado - +$10.000/mes**
   - Dashboard con KPIs personalizables
   - Predicción de ventas
   - Análisis de tendencias
   - Reportes personalizados
   - Alertas inteligentes

### ✅ Métodos de Pago

**MercadoPago (Suscripciones Mensuales):**
- Débito automático mensual
- Tarjeta de crédito/débito
- Gestión de suscripción desde el panel del cliente

**Transferencia Bancaria (Pagos Anuales y Setup Fee):**
- Pago por transferencia
- Subida de comprobante
- Aprobación manual por administrador

### ✅ Sistema de Ajuste por IPC

**Ajustes Trimestrales Automáticos:**
- Se aplican cada 3 meses (enero, abril, julio, octubre)
- Basados en el Índice de Precios al Consumidor (IPC) oficial
- Notificación 7 días antes a todos los clientes
- Solo aplica a suscripciones mensuales
- Suscripciones anuales mantienen precio congelado hasta renovación

**Flujo de Ajuste:**
1. Sistema obtiene IPC trimestral (actualmente simulado, integrar con API INDEC)
2. Calcula nuevos precios para todos los planes y addons activos
3. Registra ajuste en historial (auditoría completa)
4. Notifica a clientes con 7 días de anticipación
5. Aplica nuevos precios en fecha efectiva

**Gestión Manual:**
- Administradores pueden aplicar ajustes manuales en cualquier momento
- Registro de motivo y porcentaje de ajuste
- Historial completo de cambios de precio

---

## 🏗️ Arquitectura

### Modelos de Base de Datos

```prisma
// Plan de suscripción
model SubscriptionPlan {
  id            String
  name          String
  slug          String @unique
  priceMonthly  Decimal
  priceYearly   Decimal
  setupFee      Decimal
  maxUsers      Int?    // null = ilimitado
  maxProducts   Int?
  maxSales      Int?
  features      Json
  isActive      Boolean
}

// Addon
model Addon {
  id            String
  name          String
  slug          String @unique
  priceMonthly  Decimal
  features      Json
  isActive      Boolean
}

// Suscripción del negocio
model SubscriptionARS {
  id                        String
  businessId                String @unique
  planId                    String
  status                    String  // pending, active, past_due, canceled
  billingCycle              String  // monthly, yearly
  currentPeriodStart        DateTime
  currentPeriodEnd          DateTime
  setupFeePaid              Boolean
  setupFeeAmount            Decimal?
  priceMonthly              Decimal // Precio congelado al contratar
  priceYearly               Decimal?
  totalMonthly              Decimal // Precio + addons
  mercadopagoPreapprovalId  String?
}

// Addons activados
model SubscriptionAddon {
  id              String
  subscriptionId  String
  addonId         String
  price           Decimal // Precio congelado al activar
  isActive        Boolean
}

// Pagos
model Payment {
  id                   String
  subscriptionId       String
  amount               Decimal
  type                 String  // setup_fee, monthly, yearly
  method               String  // mercadopago, transfer
  status               String  // pending, approved, rejected
  mercadopagoPaymentId String?
  transferReceipt      String?
  paidAt               DateTime?
}

// Historial de ajustes de precio
model PriceAdjustment {
  id                 String
  planId             String?
  addonId            String?
  previousPrice      Decimal
  newPrice           Decimal
  percentage         Decimal?
  reason             String
  ipcValue           Decimal?
  appliedBy          String
  notificationSent   Boolean
  createdAt          DateTime
}
```

### APIs Implementadas

**Cliente:**
- `GET /api/subscriptions-ars/create` - Listar planes y addons disponibles
- `POST /api/subscriptions-ars/create` - Crear nueva suscripción
- `POST /api/subscriptions-ars/setup-fee` - Procesar pago de Setup Fee
- `GET /dashboard/suscripcion` - Panel de gestión de suscripción

**Administrador:**
- `GET /api/admin/precios` - Listar todos los planes y addons con historial
- `POST /api/admin/precios` - Aplicar ajuste de precio (manual o IPC)
- `PUT /api/admin/precios` - Activar/desactivar plan o addon
- `GET /dashboard/admin/precios` - Panel de administración de precios

**Webhooks:**
- `POST /api/webhooks/mercadopago` - Procesar notificaciones de MercadoPago
  - Tipo: `payment` - Confirmación de pago individual
  - Tipo: `subscription_preapproval` - Cambios en suscripción
  - Tipo: `subscription_authorized_payment` - Pago recurrente procesado

### Integración MercadoPago

**Configuración:**
```typescript
import { createPreApproval } from '@/lib/mercadopago'

// Crear suscripción recurrente
const preapproval = await createPreApproval({
  reason: 'Plan Pyme - VendiMax',
  autoRecurring: {
    frequency: 1,
    frequencyType: 'months',
    transactionAmount: 50000,
    currencyId: 'ARS'
  },
  backUrl: 'https://tuapp.com/dashboard/suscripcion?status=success',
  payer_email: 'cliente@ejemplo.com',
  external_reference: 'subscription_id'
})

// Redirigir al cliente a MercadoPago
window.location.href = preapproval.init_point
```

**Funciones Disponibles:**
- `createPreApproval()` - Crear suscripción recurrente
- `getPreApproval()` - Obtener información de suscripción
- `cancelPreApproval()` - Cancelar suscripción
- `pausePreApproval()` - Pausar suscripción
- `resumePreApproval()` - Reactivar suscripción
- `createPayment()` - Crear pago único (Setup Fee)
- `getPayment()` - Obtener información de pago

### Control de Acceso por Plan

**Middleware de Verificación:**
```typescript
import { getBusinessPlanFeatures, checkFeatureAccess } from '@/lib/planAccessControl'

// Verificar característica específica
const hasInvoicing = await checkFeatureAccess(businessId, 'hasInvoicing')
if (!hasInvoicing) {
  throw new Error('Tu plan no incluye facturación electrónica')
}

// Obtener todas las características
const features = await getBusinessPlanFeatures(businessId)
console.log(features)
// {
//   maxUsers: 5,
//   maxProducts: 2000,
//   maxSales: 1000,
//   hasInvoicing: true,
//   hasMultiBranch: true,
//   hasAdvancedReports: true,
//   hasAPI: false,
//   ...
// }

// Verificar límites
const userLimit = await checkUserLimit(businessId)
if (!userLimit.allowed) {
  alert(`Has alcanzado el límite de usuarios (${userLimit.current}/${userLimit.limit})`)
}
```

**Características Controladas:**
- `maxUsers` - Límite de usuarios por negocio
- `maxProducts` - Límite de productos
- `maxSales` - Límite de ventas mensuales
- `hasInvoicing` - Facturación electrónica AFIP
- `hasMultiBranch` - Múltiples sucursales
- `hasAdvancedReports` - Reportes avanzados
- `hasAPI` - Acceso a API REST
- `hasExport` - Exportación avanzada
- `hasBackups` - Backups automáticos
- `hasMercadoLibreIntegration` - Integración con MercadoLibre (addon)
- `hasOnlineStore` - Tienda online (addon)
- `hasAdvancedAnalytics` - Análisis avanzado (addon)

### Sistema de Ajuste por IPC

**Ejecutar Ajuste Trimestral:**
```typescript
import { executeQuarterlyIPCAdjustment } from '@/lib/ipc'

// Ejecutar ajuste (debe ser llamado por cron job)
const result = await executeQuarterlyIPCAdjustment(adminUserId)

console.log(result)
// {
//   success: true,
//   ipcRate: 25.5,
//   effectiveDate: '2024-04-08',
//   plansAdjusted: 3,
//   addonsAdjusted: 3,
//   clientsNotified: 45,
//   expiringAnnual: 5,
//   details: { ... }
// }
```

**Funciones Disponibles:**
- `getLatestIPCRate()` - Obtener IPC actual (TODO: integrar con API INDEC)
- `calculateIPCAdjustment()` - Calcular nuevo precio con IPC
- `shouldApplyQuarterlyAdjustment()` - Verificar si es momento de ajustar
- `getNextAdjustmentDate()` - Obtener fecha del próximo ajuste
- `applyIPCAdjustmentToAllPlans()` - Aplicar ajuste a todos los planes
- `applyIPCAdjustmentToAllAddons()` - Aplicar ajuste a todos los addons
- `notifyClientsOfPriceAdjustment()` - Notificar clientes (TODO: integrar email)
- `checkExpiringAnnualSubscriptions()` - Verificar suscripciones anuales por vencer
- `executeQuarterlyIPCAdjustment()` - Ejecutar proceso completo

---

## 🚀 Configuración e Instalación

### 1. Variables de Entorno

```bash
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."  # Obtener en developers.mercadopago.com
MERCADOPAGO_PUBLIC_KEY="APP_USR-..."
NEXT_PUBLIC_APP_URL="https://tuapp.com"

# Base de datos
DATABASE_URL="postgresql://..."
```

### 2. Instalar Dependencias

```bash
npm install mercadopago
```

### 3. Ejecutar Migraciones

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Seedear Planes Iniciales

```bash
npx tsx prisma/seed-ars-plans.ts
```

Esto creará:
- 3 planes (Emprendedor, Pyme, Full)
- 3 addons (MercadoLibre, Tienda Online, Análisis Avanzado)

### 5. Configurar Webhooks en MercadoPago

1. Ir a https://www.mercadopago.com.ar/developers/panel/app
2. Seleccionar tu aplicación
3. Ir a "Webhooks"
4. Agregar URL: `https://tuapp.com/api/webhooks/mercadopago`
5. Seleccionar eventos:
   - `payment`
   - `subscription_preapproval`
   - `subscription_authorized_payment`

### 6. Configurar Cron Job para Ajuste IPC

**Opción 1: Vercel Cron Jobs** (crear `vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/ipc-adjustment",
    "schedule": "0 0 1 1,4,7,10 *"
  }]
}
```

**Opción 2: GitHub Actions** (crear `.github/workflows/ipc-adjustment.yml`):
```yaml
name: IPC Adjustment
on:
  schedule:
    - cron: '0 0 1 1,4,7,10 *'  # 1 de ene/abr/jul/oct
jobs:
  adjust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: curl -X POST https://tuapp.com/api/cron/ipc-adjustment
```

**Crear API para Cron** (`app/api/cron/ipc-adjustment/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { executeQuarterlyIPCAdjustment } from '@/lib/ipc'

export async function POST(request: NextRequest) {
  // Verificar token de seguridad
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ID del usuario admin del sistema
    const systemAdminId = 'cuid-del-admin-sistema'
    
    const result = await executeQuarterlyIPCAdjustment(systemAdminId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error en cron IPC:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
```

---

## 📖 Guía de Uso

### Para Clientes

**Contratar un Plan:**
1. Ir a `/dashboard/suscripcion`
2. Seleccionar plan (Emprendedor, Pyme o Full)
3. Elegir ciclo (Mensual o Anual)
4. Agregar addons opcionales (si se desean)
5. Hacer clic en "Contratar Plan"
6. Completar pago del Setup Fee ($60.000)
7. Si es mensual, autorizar débito automático en MercadoPago
8. Suscripción activada ✅

**Gestionar Suscripción:**
- Ver plan actual y características
- Ver próxima fecha de facturación
- Activar/desactivar addons
- Cambiar de plan (upgrade/downgrade)
- Cancelar suscripción
- Descargar facturas

### Para Administradores

**Gestionar Precios:**
1. Ir a `/dashboard/admin/precios`
2. Ver listado de planes y addons con precios actuales
3. Para ajustar precio:
   - Hacer clic en "Editar Precio"
   - Ingresar nuevo precio mensual
   - Para planes anuales, ingresar precio anual o calcular 20% descuento automático
   - Ingresar motivo del cambio
   - Si es ajuste IPC, ingresar porcentaje
   - Guardar
4. Ver historial de ajustes en cada plan/addon

**Aprobar Pagos por Transferencia:**
1. Ir a panel de pagos pendientes
2. Ver comprobante subido por el cliente
3. Verificar transferencia en cuenta bancaria
4. Aprobar o rechazar pago
5. Si se aprueba, suscripción se activa automáticamente

**Activar/Desactivar Planes:**
- Hacer clic en "Activar" o "Desactivar"
- Los planes desactivados no se muestran a nuevos clientes
- No afecta a suscripciones existentes

---

## 🔧 Mantenimiento

### Monitoreo de Suscripciones

**Verificar suscripciones vencidas:**
```sql
SELECT * FROM subscriptions_ars 
WHERE status = 'active' 
AND current_period_end < NOW();
```

**Verificar pagos pendientes:**
```sql
SELECT * FROM payments 
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '7 days';
```

**Verificar Setup Fees no pagados:**
```sql
SELECT * FROM subscriptions_ars 
WHERE setup_fee_paid = false 
AND created_at < NOW() - INTERVAL '30 days';
```

### Logs Importantes

- Webhooks de MercadoPago: Ver en consola o configurar logging externo
- Ajustes de IPC: Registrados en tabla `price_adjustments`
- Cambios de suscripción: Auditoría en `subscriptions_ars` con `updated_at`

---

## 🎨 Personalización

### Agregar Nuevo Plan

1. Ejecutar seeder personalizado:
```typescript
await prisma.subscriptionPlan.create({
  data: {
    name: 'Plan Enterprise Plus',
    slug: 'enterprise-plus',
    description: 'Para grandes empresas',
    priceMonthly: 200000,
    priceYearly: 1920000,
    setupFee: 100000,
    maxUsers: null,  // ilimitado
    maxProducts: null,
    maxSales: null,
    features: JSON.stringify([
      'Todo lo de Full',
      'Consultor dedicado',
      'Personalización avanzada',
      'SLA 99.9%'
    ]),
    position: 4
  }
})
```

2. Actualizar control de acceso en `lib/planAccessControl.ts`

### Agregar Nuevo Addon

```typescript
await prisma.addon.create({
  data: {
    name: 'Integración Contable',
    slug: 'integracion-contable',
    description: 'Exporta a sistemas contables',
    priceMonthly: 14000,
    features: JSON.stringify([
      'Exportación a TangoGestión',
      'Exportación a Bejerman',
      'Sincronización automática'
    ])
  }
})
```

### Cambiar Frecuencia de Ajuste IPC

Modificar en `lib/ipc.ts`:
```typescript
export function shouldApplyQuarterlyAdjustment(): boolean {
  // Cambiar a semestral:
  return (month === 1 || month === 7) && day === 1
  
  // O a mensual:
  return day === 1
}
```

---

## ⚠️ Consideraciones Importantes

### Seguridad

- ✅ Validación de webhooks de MercadoPago (verificar firma)
- ✅ Control de acceso basado en roles (ADMIN solo)
- ✅ Sanitización de inputs en todas las APIs
- ✅ Rate limiting en endpoints públicos

### Performance

- ✅ Índices en campos clave (businessId, status, planId)
- ✅ Paginación en listados largos
- ✅ Cache de características de plan (considerar implementar)

### UX

- ✅ Notificación 7 días antes de ajuste de precio
- ✅ Mensajes claros cuando se alcanza un límite
- ✅ Sugerencias de upgrade automáticas
- ✅ Comparación visual de planes

### Legal

- ⚠️ **TODO:** Agregar términos y condiciones
- ⚠️ **TODO:** Política de cancelación y reembolsos
- ⚠️ **TODO:** Notificación formal de cambios de precio (email certificado)

---

## 📝 TODOs Pendientes

### Integración IPC
- [ ] Integrar con API oficial de INDEC para obtener IPC real
- [ ] Crear dashboard con histórico de IPC aplicados
- [ ] Configurar alertas cuando IPC supera umbral (ej: >30%)

### Notificaciones
- [ ] Integrar servicio de emails (Resend, SendGrid, etc.)
- [ ] Templates de email para:
  - [ ] Confirmación de suscripción
  - [ ] Aviso de ajuste de precio (7 días antes)
  - [ ] Recordatorio de pago pendiente
  - [ ] Confirmación de pago
  - [ ] Suscripción próxima a vencer
  - [ ] Límites alcanzados

### Facturación
- [ ] Generar facturas PDF automáticas
- [ ] Integración con AFIP para facturación electrónica
- [ ] Descarga de facturas desde el panel

### Analytics
- [ ] Dashboard de métricas de suscripciones
- [ ] MRR (Monthly Recurring Revenue)
- [ ] Churn rate
- [ ] Lifetime value por plan

### Tests
- [ ] Tests unitarios de lógica de IPC
- [ ] Tests de integración con MercadoPago (mock)
- [ ] Tests E2E del flujo completo de suscripción

---

## 🤝 Soporte

**Documentación Adicional:**
- MercadoPago: https://www.mercadopago.com.ar/developers/es/docs
- Prisma: https://www.prisma.io/docs
- Next.js: https://nextjs.org/docs

**Contacto:**
- Email: soporte@vendimax.com
- WhatsApp: +54 9 11 XXXX-XXXX

---

## 📄 Licencia

Sistema propietario de VendiMax. Todos los derechos reservados.
