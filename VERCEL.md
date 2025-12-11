# VendiMax - Variables de Entorno para Vercel

## 🔧 Configuración para Producción

Cuando subas a Vercel, necesitas configurar estas variables de entorno:

### 1. Base de Datos (Neon, Supabase, o Railway)

**Opción Recomendada: Neon (PostgreSQL gratis)**
1. Ve a https://neon.tech
2. Crea una cuenta y un proyecto
3. Copia la connection string

```env
DATABASE_URL="postgresql://usuario:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

### 2. NextAuth

```env
NEXTAUTH_URL="https://tu-app.vercel.app"
NEXTAUTH_SECRET="genera-un-secreto-con-openssl-rand-base64-32"
```

## 📝 Pasos en Vercel

1. **Ir a Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Import Git Repository**
   - Conecta tu GitHub/GitLab
   - O sube directamente con Vercel CLI

3. **Configurar Variables de Entorno**
   - Settings → Environment Variables
   - Agregar las 3 variables arriba

4. **Build Settings** (automático si usas vercel.json)
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

5. **Deploy**
   - Click en "Deploy"
   - Espera ~2-3 minutos

## 🗄️ Base de Datos Gratuitas

### Opción 1: Neon (Recomendada)
- ✅ PostgreSQL gratis
- ✅ 512 MB de almacenamiento
- ✅ Serverless
- 🔗 https://neon.tech

### Opción 2: Supabase
- ✅ PostgreSQL gratis
- ✅ 500 MB de almacenamiento
- ✅ Incluye Auth y Storage
- 🔗 https://supabase.com

### Opción 3: Railway
- ✅ PostgreSQL gratis (5$ crédito)
- ✅ 1 GB de almacenamiento
- 🔗 https://railway.app

## 🚀 Deploy con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Durante el deploy, te pedirá:
1. Setup and deploy? → Yes
2. Which scope? → Tu cuenta
3. Link to existing project? → No
4. Project name? → vendimax
5. Directory? → ./
6. Override settings? → No

Luego configura las env variables en el dashboard.

## ⚠️ IMPORTANTE: Migraciones

Después del primer deploy:

```bash
# Conectar a tu DB de producción y ejecutar:
npx prisma migrate deploy
npx prisma db seed
```

O usa Prisma Studio:
```bash
npx prisma studio --schema=./prisma/schema.prisma
```

## 🔐 Generar NEXTAUTH_SECRET

```bash
# En PowerShell
openssl rand -base64 32

# O en Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## ✅ Checklist Final

- [ ] Base de datos PostgreSQL creada (Neon/Supabase/Railway)
- [ ] DATABASE_URL configurada en Vercel
- [ ] NEXTAUTH_URL configurada (tu dominio de Vercel)
- [ ] NEXTAUTH_SECRET generada y configurada
- [ ] Build exitoso en Vercel
- [ ] Migraciones ejecutadas (`prisma migrate deploy`)
- [ ] Seed ejecutado (`prisma db seed`)
- [ ] Login funcional en producción

## 🎯 URLs Finales

- **App**: https://vendimax.vercel.app (o tu dominio custom)
- **Login**: https://vendimax.vercel.app/login
- **Dashboard**: https://vendimax.vercel.app/dashboard

---

**¡Tu app estará lista en producción!** 🚀
