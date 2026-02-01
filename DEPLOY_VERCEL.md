# 🚀 Deploy a Vercel - Instrucciones

## ✅ Código ya subido a GitHub
- Repositorio: https://github.com/goonfarias11/vendimax
- Branch: main
- Commit: Sistema de gestión automática de trials implementado

## 📋 Pasos para Deploy en Vercel

### 1. Ir a Vercel
1. Abre: https://vercel.com
2. Click en **"Add New"** → **"Project"**

### 2. Importar Repositorio
1. Selecciona **"Import Git Repository"**
2. Conecta tu cuenta de GitHub si aún no lo hiciste
3. Busca y selecciona: **goonfarias11/vendimax**
4. Click en **"Import"**

### 3. Configurar el Proyecto

#### Framework Preset
- Vercel detectará automáticamente **Next.js**
- No cambies nada aquí

#### Build and Output Settings
Ya están configurados en `vercel.json`:
```
Build Command: prisma generate && next build
Install Command: npm install
Output Directory: .next
```

#### Root Directory
- Dejar en: `./` (raíz del proyecto)

### 4. ⚠️ IMPORTANTE: Variables de Entorno

Antes de hacer deploy, debes configurar estas variables de entorno en Vercel:

#### ✅ Variables Requeridas

1. **Base de Datos**
```
DATABASE_URL=postgresql://usuario:password@host:5432/vendimax
```
> 💡 Puedes usar:
> - **Vercel Postgres** (gratis hasta 256MB)
> - **Supabase** (PostgreSQL gratis)
> - **Neon** (PostgreSQL gratis)
> - **Railway** (PostgreSQL)

2. **Autenticación**
```
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=genera-uno-con: openssl rand -base64 32
AUTH_SECRET=el-mismo-que-nextauth
```

3. **Cron Jobs** (NUEVO - Importante!)
```
CRON_SECRET=genera-uno-con: openssl rand -base64 32
```

4. **Mercado Pago** (Suscripciones)
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-token-aqui
MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

5. **Email** (Opcional - para notificaciones)
```
RESEND_API_KEY=re_tu-api-key-aqui
EMAIL_FROM=VendiMax <no-reply@tu-dominio.com>
```

#### 📝 Cómo Agregar Variables en Vercel

1. En la página de configuración del proyecto
2. Scroll hasta **"Environment Variables"**
3. Agrega cada variable:
   - **Name**: Nombre de la variable (ej: `DATABASE_URL`)
   - **Value**: Valor de la variable
   - **Environment**: Selecciona **Production**, **Preview**, y **Development**
4. Click en **"Add"**

### 5. Deploy

1. Una vez configuradas las variables, click en **"Deploy"**
2. Vercel comenzará a:
   - ✓ Instalar dependencias
   - ✓ Generar cliente de Prisma
   - ✓ Construir el proyecto Next.js
   - ✓ Optimizar assets
   - ✓ Desplegar a producción

3. Espera 2-3 minutos

### 6. Configurar Base de Datos

Una vez desplegado, necesitas ejecutar las migraciones:

**Opción A: Desde Vercel CLI (Recomendado)**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Ejecutar comando en producción
vercel env pull .env.production
npx prisma migrate deploy
```

**Opción B: Desde tu terminal local**
```bash
# Usar la DATABASE_URL de producción
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

**Opción C: Usar Prisma Studio**
```bash
# Conectar a la BD de producción
DATABASE_URL="postgresql://..." npx prisma db push
```

### 7. Verificar el Cron Job

El cron job para verificar trials ya está configurado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-trials",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Esto ejecutará el endpoint **diariamente a las 9:00 AM UTC**.

Para verificar que funciona:
1. Ve a tu proyecto en Vercel Dashboard
2. Click en **"Settings"** → **"Cron Jobs"**
3. Deberías ver: `/api/cron/check-trials` programado

### 8. Probar el Cron Manualmente

Puedes probar el cron haciendo una request:

```bash
curl -X GET https://tu-app.vercel.app/api/cron/check-trials \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

Debería responder:
```json
{
  "success": true,
  "timestamp": "2026-02-01T...",
  "results": {
    "notificationsSent": 0,
    "trialsExpired": 0,
    "errors": []
  }
}
```

## 🎯 Checklist Post-Deploy

- [ ] App desplegada exitosamente
- [ ] Base de datos conectada
- [ ] Migraciones ejecutadas
- [ ] Variables de entorno configuradas
- [ ] CRON_SECRET agregado
- [ ] Cron job visible en Vercel Dashboard
- [ ] Puedes crear una cuenta de prueba
- [ ] El trial de 7 días se activa
- [ ] La página de suscripción funciona

## 🔍 Verificar que Todo Funciona

### 1. Registro
```
https://tu-app.vercel.app/registro
```
- Crea una cuenta
- Verifica que te asigne rol OWNER
- Verifica que cree el Business
- Verifica que active trial de 7 días

### 2. Dashboard
```
https://tu-app.vercel.app/dashboard
```
- Inicia sesión
- Verifica que puedas acceder
- Revisa que tengas acceso a todas las secciones

### 3. Suscripciones
```
https://tu-app.vercel.app/dashboard/suscripcion
```
- Verifica que se muestren los planes
- Intenta iniciar el proceso de pago (no completes el pago si es prueba)

### 4. Base de Datos
Verifica en Prisma Studio o tu dashboard de BD:
```sql
SELECT * FROM subscriptions_ars WHERE free_trial = true;
SELECT * FROM businesses WHERE plan_type = 'PRO';
```

## 🐛 Troubleshooting

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté correcta
- Asegúrate de que la BD acepte conexiones externas
- Para Supabase/Neon, usa connection pooling

### Error: "Prisma Client not generated"
- Vercel debería ejecutar `prisma generate` automáticamente
- Verifica en Build Logs que no haya errores

### Cron Job no aparece
- Asegúrate de haber hecho deploy después de agregar `vercel.json`
- Espera unos minutos, a veces tarda en detectarlo
- Re-deploy si es necesario

### Emails no se envían
- Verifica que `RESEND_API_KEY` esté configurada
- Los emails de trial requieren esta configuración
- Puedes usar Resend.com (gratis hasta 3,000 emails/mes)

## 📊 Monitorear el Sistema

### Logs en Vercel
1. Ve a tu proyecto en Vercel
2. Click en **"Logs"**
3. Filtra por función: `/api/cron/check-trials`
4. Verás la ejecución diaria del cron

### Analytics
Vercel incluye analytics gratis:
- Visitas
- Errores
- Performance
- Web Vitals

## 🎉 ¡Listo!

Tu aplicación VendiMax ahora está en producción con:
- ✅ Sistema completo de suscripciones
- ✅ Prueba gratuita de 7 días automatizada
- ✅ Notificaciones por email
- ✅ Degradación automática a plan FREE
- ✅ Cron jobs configurados
- ✅ Base de datos PostgreSQL
- ✅ Autenticación con NextAuth

## 🔗 URLs Importantes

- **App en Producción**: https://tu-app.vercel.app
- **GitHub Repo**: https://github.com/goonfarias11/vendimax
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Documentación**: Ver README.md y docs/TRIAL_MANAGEMENT.md

---

**¿Necesitas ayuda?** Revisa la documentación o contacta al equipo de desarrollo.
