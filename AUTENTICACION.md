# 🔐 Autenticación en VendiMax

Sistema de autenticación completo implementado con **NextAuth v5**, **Prisma**, y **bcrypt**.

## 📋 Características Implementadas

✅ **Registro de usuarios** con hash de contraseñas (bcrypt)  
✅ **Login con credenciales** (email + password)  
✅ **Sesiones JWT** protegidas  
✅ **Middleware** para proteger rutas del dashboard  
✅ **Información del usuario** en el topbar (nombre, email, rol)  
✅ **Cierre de sesión** funcional  
✅ **Redirecciones automáticas** (login → dashboard si autenticado)

---

## 🗄️ Configuración de Base de Datos

### 1. Instalar PostgreSQL

Descarga e instala PostgreSQL desde: https://www.postgresql.org/download/

### 2. Crear Base de Datos

```sql
CREATE DATABASE vendimax;
```

### 3. Configurar Variables de Entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/vendimax"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-super-seguro-cambiame-en-produccion"
```

**⚠️ IMPORTANTE:** Cambia `tu_password` por tu contraseña de PostgreSQL.

### 4. Aplicar Migraciones

```bash
npm run db:push
```

Este comando creará todas las tablas en la base de datos.

### 5. Poblar Base de Datos (Seed)

```bash
npm run db:seed
```

Esto creará usuarios de prueba y datos iniciales:

**👤 Usuarios creados:**

| Email                    | Contraseña    | Rol      |
|--------------------------|---------------|----------|
| admin@vendimax.com       | admin123      | ADMIN    |
| vendedor@vendimax.com    | vendedor123   | VENDEDOR |

---

## 🚀 Uso del Sistema

### Iniciar el Servidor

```bash
npm run dev
```

### Rutas Disponibles

| Ruta          | Descripción                          | Protegida |
|---------------|--------------------------------------|-----------|
| `/`           | Landing page                         | No        |
| `/login`      | Página de inicio de sesión           | No        |
| `/registro`   | Página de registro de nuevos usuarios| No        |
| `/dashboard`  | Dashboard principal                  | ✅ Sí      |
| `/dashboard/*`| Todas las rutas del dashboard        | ✅ Sí      |

### Flujo de Autenticación

1. **Registro:**
   - Visita `/registro`
   - Completa el formulario (nombre, email, contraseña)
   - El sistema hashea la contraseña con bcrypt
   - Se crea el usuario en la base de datos
   - Redirección automática a `/login`

2. **Login:**
   - Visita `/login` o intenta acceder a `/dashboard`
   - Ingresa email y contraseña
   - NextAuth valida las credenciales
   - Si es correcto, crea sesión JWT
   - Redirección a `/dashboard`

3. **Sesión Activa:**
   - El middleware protege todas las rutas `/dashboard/*`
   - El topbar muestra: iniciales, nombre, email y rol del usuario
   - Click en el avatar despliega menú con opción "Cerrar sesión"

4. **Logout:**
   - Click en "Cerrar sesión"
   - NextAuth destruye la sesión
   - Redirección a `/login`

---

## 🏗️ Arquitectura

### Archivos Clave

```
├── lib/
│   ├── auth.ts                 # Configuración de NextAuth
│   ├── prisma.ts              # Cliente de Prisma
│   └── config.ts              # Configuración del sitio
│
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts       # Handlers de NextAuth (GET/POST)
│   │   └── register/
│   │       └── route.ts       # API de registro de usuarios
│   ├── login/
│   │   └── page.tsx           # Página de login
│   ├── registro/
│   │   └── page.tsx           # Página de registro
│   └── dashboard/
│       └── ...                # Rutas protegidas
│
├── components/
│   ├── session-provider.tsx   # Proveedor de sesión de NextAuth
│   └── dashboard/
│       └── topbar.tsx         # Topbar con info de usuario
│
├── middleware.ts              # Protección de rutas
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── seed.ts                # Script de datos iniciales
│   └── migrations/            # Migraciones SQL
│
└── types/
    └── next-auth.d.ts         # Types de NextAuth extendidos
```

### Roles de Usuario

Definidos en `prisma/schema.prisma`:

```prisma
enum UserRole {
  ADMIN      // Acceso total al sistema
  VENDEDOR   // Crear ventas, ver inventario
  CAJERO     // Gestión de caja, ventas básicas
  GERENTE    // Reportes, configuración
}
```

---

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con **bcrypt** (10 rounds)
- ✅ Sesiones con **JWT** (no se almacenan en base de datos)
- ✅ Validación de inputs en servidor
- ✅ Protección CSRF por defecto (NextAuth)
- ✅ Variables sensibles en `.env` (no commiteadas)
- ✅ Middleware que bloquea acceso no autorizado

---

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor en modo desarrollo

# Base de Datos
npm run db:generate      # Generar Prisma Client
npm run db:push          # Aplicar schema a la DB (sin migraciones)
npm run db:seed          # Poblar DB con datos de prueba
npm run db:studio        # Abrir Prisma Studio (UI de DB)

# Producción
npm run build            # Compilar para producción
npm run start            # Iniciar servidor de producción
```

---

## 🧪 Testing Manual

### 1. Registro de Usuario

```bash
POST http://localhost:3000/api/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123"
}
```

### 2. Login

Usa el formulario en `/login` con:
- Email: `admin@vendimax.com`
- Password: `admin123`

### 3. Acceso al Dashboard

Después de login exitoso, deberías ver:
- ✅ Redirección automática a `/dashboard`
- ✅ Topbar con tus iniciales y nombre
- ✅ Menú desplegable con email y rol
- ✅ Opción de cerrar sesión

### 4. Protección de Rutas

Intenta acceder a `/dashboard` sin login:
- ✅ Redirección automática a `/login`

Intenta acceder a `/login` con sesión activa:
- ✅ Redirección automática a `/dashboard`

---

## 🚨 Troubleshooting

### Error: "Cannot connect to database"

**Solución:**
1. Verifica que PostgreSQL esté corriendo
2. Revisa el `DATABASE_URL` en `.env`
3. Asegúrate de que la DB `vendimax` exista
4. Ejecuta `npm run db:push`

### Error: "Invalid credentials"

**Solución:**
1. Verifica que el usuario exista en la DB
2. Ejecuta `npm run db:seed` si no has poblado la DB
3. Usa las credenciales correctas (ver sección "Usuarios creados")

### Error: "Session provider not found"

**Solución:**
1. Verifica que `SessionProvider` esté en `app/layout.tsx`
2. Reinicia el servidor (`npm run dev`)

### Cambios no se reflejan

**Solución:**
```bash
# Limpiar caché
Remove-Item -Recurse -Force .next

# Regenerar Prisma Client
npm run db:generate

# Reiniciar servidor
npm run dev
```

---

## 🔄 Próximos Pasos (Opcional)

- [ ] Recuperación de contraseña (reset password)
- [ ] Verificación de email
- [ ] Two-Factor Authentication (2FA)
- [ ] OAuth providers (Google, GitHub)
- [ ] Roles y permisos granulares
- [ ] Logs de actividad de usuario
- [ ] Bloqueo de cuenta tras intentos fallidos

---

## 📚 Documentación

- **NextAuth v5:** https://authjs.dev/getting-started
- **Prisma:** https://www.prisma.io/docs
- **bcrypt:** https://github.com/kelektiv/node.bcrypt.js

---

**✨ Autenticación implementada con éxito!**
