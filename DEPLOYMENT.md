# Guía de Despliegue - VendiMax

## Opciones de Despliegue

### 1. Vercel (Recomendado)

Vercel es la plataforma creada por el equipo de Next.js y ofrece el mejor rendimiento.

#### Pasos:

1. **Crear cuenta en Vercel**
   - Visita [vercel.com](https://vercel.com)
   - Registrate con GitHub, GitLab o Bitbucket

2. **Conectar repositorio**
   ```bash
   # Inicializa Git (si no lo has hecho)
   git init
   git add .
   git commit -m "Initial commit"
   
   # Sube a GitHub
   git remote add origin https://github.com/tu-usuario/vendimax.git
   git push -u origin main
   ```

3. **Importar proyecto en Vercel**
   - Click en "New Project"
   - Selecciona tu repositorio
   - Vercel detectará Next.js automáticamente
   - Click en "Deploy"

4. **Variables de entorno**
   - En Vercel Dashboard > Settings > Environment Variables
   - Agrega las variables necesarias de `.env.example`

**URL de producción**: `https://tu-proyecto.vercel.app`

### 2. Netlify

Alternativa popular con excelente rendimiento.

#### Pasos:

1. **Instalar Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build del proyecto**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Configuración**
   - Build command: `npm run build`
   - Publish directory: `.next`

### 3. Railway

Plataforma moderna con soporte para bases de datos.

#### Pasos:

1. **Crear cuenta en Railway**
   - Visita [railway.app](https://railway.app)

2. **Nuevo proyecto desde GitHub**
   - Connect repository
   - Railway detectará Next.js automáticamente

3. **Variables de entorno**
   - Agrega en Railway Dashboard

### 4. Docker (Auto-hospedado)

Para servidor propio con control total.

#### Dockerfile:

```dockerfile
FROM node:18-alpine AS base

# Instalar dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### docker-compose.yml:

```yaml
version: '3.8'

services:
  vendimax:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

#### Comandos:

```bash
# Build
docker build -t vendimax .

# Run
docker run -p 3000:3000 vendimax

# Con docker-compose
docker-compose up -d
```

### 5. AWS (Amplify)

Para infraestructura AWS.

#### Pasos:

1. **Instalar Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

2. **Inicializar**
   ```bash
   amplify init
   ```

3. **Deploy**
   ```bash
   amplify publish
   ```

## Pre-Deploy Checklist

Antes de hacer deploy, verifica:

- [ ] `npm run build` se ejecuta sin errores
- [ ] Variables de entorno configuradas
- [ ] Archivos `.env` NO están en Git (.gitignore)
- [ ] Metadata SEO configurada correctamente
- [ ] Imágenes optimizadas
- [ ] Pruebas en diferentes navegadores
- [ ] Responsive verificado (móvil, tablet, desktop)
- [ ] Analytics configurado (opcional)
- [ ] Dominio personalizado configurado (opcional)

## Optimizaciones Post-Deploy

### 1. Configurar Dominio Personalizado

**Vercel:**
- Settings > Domains
- Agregar dominio
- Configurar DNS (A record o CNAME)

**DNS Records:**
```
A Record:
Name: @
Value: 76.76.21.21 (Vercel IP)

CNAME:
Name: www
Value: cname.vercel-dns.com
```

### 2. Configurar Analytics

**Google Analytics:**
```tsx
// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 3. Configurar CDN para Imágenes

Usa servicios como:
- Cloudinary
- ImageKit
- Vercel Image Optimization (automático)

### 4. Monitoreo

**Herramientas recomendadas:**
- Vercel Analytics (gratis en Vercel)
- Sentry (errores)
- LogRocket (sesiones de usuario)
- Hotjar (mapas de calor)

## Variables de Entorno para Producción

```env
# Producción
NEXT_PUBLIC_SITE_URL=https://vendimax.com
NODE_ENV=production

# Base de datos
DATABASE_URL=postgresql://...

# Autenticación
NEXTAUTH_URL=https://vendimax.com
NEXTAUTH_SECRET=production-secret-key

# APIs
NEXT_PUBLIC_API_URL=https://api.vendimax.com
```

## Comandos Útiles

```bash
# Build local para probar
npm run build
npm start

# Verificar errores de TypeScript
npx tsc --noEmit

# Verificar errores de ESLint
npm run lint

# Limpiar caché
rm -rf .next
npm run build
```

## Performance

### Lighthouse Scores Objetivo

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

### Optimizaciones Implementadas

✅ Image optimization con Next/Image
✅ Font optimization con next/font
✅ Code splitting automático
✅ CSS modules y Tailwind optimizado
✅ Lazy loading de componentes
✅ Metadata SEO completa

## Soporte

Para problemas de despliegue:

1. Revisar logs en la plataforma
2. Verificar variables de entorno
3. Comprobar compatibilidad de Node.js (18+)
4. Limpiar caché y rebuilding

## Recursos

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Railway Docs](https://docs.railway.app)
