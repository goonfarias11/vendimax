# Gestión Automática de Pruebas Gratuitas

## Descripción

Sistema automatizado para gestionar el ciclo de vida de las pruebas gratuitas de 7 días en VendiMax.

## Características

### 1. Notificación Anticipada (3 días antes)
- Se envía un email recordatorio cuando quedan 3 días para que expire la prueba
- Incluye detalles del plan y precio
- Link directo para suscribirse

### 2. Transición Automática al Expirar
Cuando expira la prueba gratuita:
- ✅ La cuenta se degrada automáticamente a **Plan FREE**
- ✅ El usuario **mantiene acceso** (no se bloquea)
- ✅ Se aplican límites del plan FREE:
  - 50 productos máximo
  - 100 ventas por mes
  - 1 usuario
  - Reportes básicos
- ✅ Se envía email informando del cambio

### 3. Sin Bloqueo Total
A diferencia del sistema anterior, ahora:
- El usuario puede seguir usando VendiMax con el plan FREE
- Puede actualizar a plan pago cuando desee
- No pierde acceso a sus datos

## Configuración

### 1. Variables de Entorno

Agregar en tu archivo `.env`:

```bash
# Secret para proteger el endpoint del cron job
CRON_SECRET="un-secreto-muy-seguro-aqui"
```

### 2. Base de Datos

Ejecutar la migración para agregar el campo `trialNotificationSent`:

```bash
npx prisma migrate dev --name add_trial_notification_field
```

O si prefieres usar `db push`:

```bash
npx prisma db push
```

### 3. Configuración del Cron Job

#### En Vercel (Producción)

El cron job ya está configurado en `vercel.json`:
- Se ejecuta **diariamente a las 9:00 AM** (hora del servidor)
- Path: `/api/cron/check-trials`

En Vercel, los cron jobs se ejecutan automáticamente. Solo necesitas:

1. Desplegar a Vercel
2. Agregar `CRON_SECRET` en las variables de entorno de Vercel
3. El cron se activará automáticamente

#### En Desarrollo Local

Para probar localmente, puedes ejecutar manualmente:

```bash
curl -X GET http://localhost:3000/api/cron/check-trials \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

#### Alternativa: Servicio Externo

Si no usas Vercel, puedes usar servicios como:
- **cron-job.org** (gratis)
- **EasyCron**
- **GitHub Actions**

Configurar para que llamen a:
```
GET https://tu-dominio.com/api/cron/check-trials
Header: Authorization: Bearer TU_CRON_SECRET
```

## Flujo del Usuario

### Día 0: Registro
1. Usuario se registra
2. Se crea cuenta con rol `OWNER`
3. Se activa trial de 7 días del plan PRO
4. Email de bienvenida

### Día 4: Notificación
1. Cron job detecta que quedan 3 días
2. Se envía email recordatorio
3. Se marca `trialNotificationSent = true`

### Día 7: Expiración
1. Cron job detecta trial expirado
2. Actualiza `status = "expired"` en SubscriptionARS
3. Cambia `planType = "FREE"` en Business
4. Envía email informando
5. Usuario puede seguir usando el sistema con límites FREE

### Usuario decide suscribirse
1. Va a `/dashboard/suscripcion`
2. Selecciona plan PYME o EMPRESA
3. Completa pago con Mercado Pago
4. Se activa plan pago
5. Se eliminan límites del FREE

## Endpoints

### `/api/cron/check-trials`

**Método:** `GET`

**Headers:**
```
Authorization: Bearer CRON_SECRET
```

**Respuesta:**
```json
{
  "success": true,
  "timestamp": "2026-02-01T09:00:00.000Z",
  "results": {
    "notificationsSent": 5,
    "trialsExpired": 2,
    "errors": []
  }
}
```

## Emails

### trial-expiring-soon.tsx
Email enviado 3 días antes de expirar:
- Días restantes
- Beneficios del plan
- Precio mensual
- Botón de suscripción

### trial-expired.tsx
Email enviado al expirar:
- Información del plan FREE
- Límites aplicados
- Oferta especial (50% primera semana)
- Botón de actualización

## Monitoreo

### Logs
El cron job registra:
- Cantidad de notificaciones enviadas
- Cantidad de trials expirados procesados
- Errores encontrados

### Base de Datos
Revisar tabla `plan_block_logs`:
```sql
SELECT * FROM plan_block_logs 
WHERE type = 'EXPIRED' 
ORDER BY created_at DESC;
```

### Verificar trials activos:
```sql
SELECT 
  b.name,
  sa.trial_ends_at,
  sa.trial_notification_sent,
  sa.status
FROM subscriptions_ars sa
JOIN businesses b ON b.id = sa.business_id
WHERE sa.free_trial = true
ORDER BY sa.trial_ends_at;
```

## Testing

### Probar notificación de 3 días:
1. Crear trial con `trialEndsAt` en 3 días
2. Ejecutar cron manualmente
3. Verificar email enviado

### Probar expiración:
1. Crear trial con `trialEndsAt` en el pasado
2. Ejecutar cron manualmente
3. Verificar cambio a plan FREE
4. Verificar email enviado

## Mejoras Futuras

- [ ] Notificación adicional 1 día antes
- [ ] Ofertas especiales personalizadas
- [ ] Analytics de conversión trial → pago
- [ ] Re-engagement emails después de 7 días en FREE
- [ ] Opción de extender trial por casos especiales
