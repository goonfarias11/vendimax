# 🚀 INICIO RÁPIDO - VendiMax

## ⚠️ IMPORTANTE: Primeros Pasos

**NOTA:** Si ves errores de TypeScript en `prisma/seed.ts`, es normal. Se solucionarán al ejecutar `npm run db:generate`.

## 📋 Requisitos Previos

1. **Node.js 18+** instalado
2. **PostgreSQL 14+** instalado y corriendo
3. **Git** (opcional)

## 🔧 Configuración Inicial (Primera Vez)

### Paso 1: Verificar PostgreSQL

Abre PowerShell y verifica que PostgreSQL esté corriendo:

```powershell
pg_isready -h localhost -p 5432
```

Si no está corriendo, inícialo desde los servicios de Windows.

### Paso 2: Crear Base de Datos

Abre `psql` o pgAdmin y ejecuta:

```sql
CREATE DATABASE vendimax;
```

### Paso 3: Configurar Variables de Entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
# Cambia 'password' por tu contraseña de PostgreSQL
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/vendimax"

# Deja estas como están para desarrollo local
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-super-seguro-cambiame-en-produccion"
```

### Paso 4: Instalar Dependencias

```powershell
npm install
```

### Paso 5: Generar Prisma Client

```powershell
npm run db:generate
```

**IMPORTANTE:** Este comando eliminará el error de TypeScript en `seed.ts`.

### Paso 6: Crear Tablas en la Base de Datos

```powershell
npm run db:push
```

Esto creará todas las tablas según el schema de Prisma.

### Paso 7: Poblar con Datos de Prueba

```powershell
npm run db:seed
```

Esto creará:
- 2 usuarios (admin y vendedor)
- 2 categorías
- 3 productos
- 2 clientes
- 2 proveedores

### Paso 8: Iniciar el Servidor

```powershell
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## 🎯 Probar el Sistema

### 1. Acceder al Login

Ve a http://localhost:3000/login o haz click en "Dashboard" en la landing page.

### 2. Iniciar Sesión

Usa una de estas credenciales:

**Administrador:**
- Email: `admin@vendimax.com`
- Contraseña: `admin123`

**Vendedor:**
- Email: `vendedor@vendimax.com`
- Contraseña: `vendedor123`

### 3. Explorar el Dashboard

Después de login exitoso, verás:
- ✅ Tu nombre en el topbar (esquina superior derecha)
- ✅ 8 secciones en el sidebar izquierdo
- ✅ KPIs y gráficos en el dashboard principal

### 4. Cerrar Sesión

Click en tu avatar (topbar) → "Cerrar sesión"

## 🛠️ Comandos Útiles

```powershell
# Desarrollo
npm run dev              # Iniciar servidor (http://localhost:3000)

# Base de Datos
npm run db:generate      # Generar Prisma Client (EJECUTA PRIMERO)
npm run db:push          # Aplicar cambios del schema a DB
npm run db:seed          # Poblar DB con datos de prueba
npm run db:studio        # Abrir Prisma Studio (UI de DB)

# Producción
npm run build            # Compilar para producción
npm run start            # Iniciar en producción
```

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"

**Causa:** PostgreSQL no está corriendo o credenciales incorrectas.

**Solución:**
1. Verifica que PostgreSQL esté corriendo
2. Revisa el `DATABASE_URL` en `.env`
3. Asegúrate de que la base de datos `vendimax` exista

### Error: "PrismaClient is unable to run in this browser environment"

**Causa:** Prisma Client no se generó.

**Solución:**
```powershell
npm run db:generate
```

### Error: "Invalid credentials" al hacer login

**Causa:** Usuario no existe en la base de datos.

**Solución:**
```powershell
npm run db:seed
```

### Error: "Module @prisma/client not found"

**Causa:** Dependencias no instaladas.

**Solución:**
```powershell
npm install
npm run db:generate
```

### La página no carga / Error 500

**Solución:**
```powershell
# Limpiar caché de Next.js
Remove-Item -Recurse -Force .next

# Reinstalar dependencias
Remove-Item -Recurse -Force node_modules
npm install

# Regenerar Prisma Client
npm run db:generate

# Reiniciar servidor
npm run dev
```

## 📚 Documentación Completa

- **[README.md](./README.md)** - Información general del proyecto
- **[AUTENTICACION.md](./AUTENTICACION.md)** - Guía detallada de autenticación
- **[DASHBOARD.md](./DASHBOARD.md)** - Documentación del dashboard
- **[IMPLEMENTACION.md](./IMPLEMENTACION.md)** - Resumen de implementación

## 🎉 ¡Todo Listo!

Si seguiste todos los pasos, ahora tienes:
- ✅ Sistema de autenticación funcional
- ✅ Dashboard con 8 páginas
- ✅ Base de datos PostgreSQL configurada
- ✅ Usuarios de prueba creados
- ✅ Landing page profesional

**¡Disfruta desarrollando en VendiMax! 🚀**

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa la sección "Solución de Problemas" arriba
2. Verifica que todos los pasos se ejecutaron en orden
3. Asegúrate de que PostgreSQL esté corriendo
4. Revisa los logs en la consola para errores específicos
