// Sistema de Permisos y Control de Acceso por Roles
// ===================================================

export type Role = 'OWNER' | 'ADMIN' | 'GERENTE' | 'SUPERVISOR' | 'VENDEDOR'

export type Permission = 
  // POS y Ventas
  | 'pos:access'
  | 'pos:create_sale'
  | 'pos:cancel_sale'
  | 'pos:apply_discount'
  
  // Reportes
  | 'reports:view_all'
  | 'reports:view_basic'
  | 'reports:view_financial'
  | 'reports:view_cash'
  | 'reports:export'
  
  // Productos
  | 'products:view'
  | 'products:create'
  | 'products:edit'
  | 'products:delete'
  | 'products:adjust_stock'
  | 'products:view_margins'
  
  // Clientes
  | 'clients:view'
  | 'clients:view_full_profile'
  | 'clients:create'
  | 'clients:edit'
  | 'clients:delete'
  | 'clients:view_credit'
  | 'clients:edit_credit_limit'
  | 'clients:register_payment'
  | 'clients:view_activity_log'
  
  // Caja
  | 'cash:view'
  | 'cash:register_movement'
  | 'cash:close_day'
  | 'cash:view_history'
  
  // Usuarios
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'users:change_role'
  
  // Configuración
  | 'settings:view'
  | 'settings:edit_business'
  | 'settings:edit_plans'
  | 'settings:view_saas_admin'
  
  // Auditoría
  | 'audit:view'
  | 'audit:export'

// Definición de permisos por rol
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    // Acceso TOTAL
    'pos:access',
    'pos:create_sale',
    'pos:cancel_sale',
    'pos:apply_discount',
    'reports:view_all',
    'reports:view_basic',
    'reports:view_financial',
    'reports:view_cash',
    'reports:export',
    'products:view',
    'products:create',
    'products:edit',
    'products:delete',
    'products:adjust_stock',
    'products:view_margins',
    'clients:view',
    'clients:view_full_profile',
    'clients:create',
    'clients:edit',
    'clients:delete',
    'clients:view_credit',
    'clients:edit_credit_limit',
    'clients:register_payment',
    'clients:view_activity_log',
    'cash:view',
    'cash:register_movement',
    'cash:close_day',
    'cash:view_history',
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'users:change_role',
    'settings:view',
    'settings:edit_business',
    'settings:edit_plans',
    'settings:view_saas_admin',
    'audit:view',
    'audit:export',
  ],

  ADMIN: [
    // Todo excepto SaaS admin
    'pos:access',
    'pos:create_sale',
    'pos:cancel_sale',
    'pos:apply_discount',
    'reports:view_all',
    'reports:view_basic',
    'reports:view_financial',
    'reports:view_cash',
    'reports:export',
    'products:view',
    'products:create',
    'products:edit',
    'products:delete',
    'products:adjust_stock',
    'products:view_margins',
    'clients:view',
    'clients:view_full_profile',
    'clients:create',
    'clients:edit',
    'clients:delete',
    'clients:view_credit',
    'clients:edit_credit_limit',
    'clients:register_payment',
    'clients:view_activity_log',
    'cash:view',
    'cash:register_movement',
    'cash:close_day',
    'cash:view_history',
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'users:change_role',
    'settings:view',
    'settings:edit_business',
    'audit:view',
    'audit:export',
  ],

  GERENTE: [
    // Gestión y análisis
    'pos:access',
    'pos:create_sale',
    'reports:view_all',
    'reports:view_basic',
    'reports:view_financial',
    'reports:export',
    'products:view',
    'products:create',
    'products:edit',
    'products:adjust_stock',
    'products:view_margins',
    'clients:view',
    'clients:view_full_profile',
    'clients:create',
    'clients:edit',
    'clients:view_credit',
    'clients:edit_credit_limit',
    'clients:register_payment',
    'cash:view',
    'cash:view_history',
    'users:view',
    'audit:view',
  ],

  SUPERVISOR: [
    // Control operativo
    'pos:access',
    'pos:create_sale',
    'pos:apply_discount',
    'reports:view_basic',
    'reports:view_cash',
    'products:view',
    'clients:view',
    'clients:view_credit',
    'cash:view',
  ],

  VENDEDOR: [
    'pos:access',
    'pos:create_sale',
    'clients:view',
    'clients:view_credit',
    'clients:register_payment',
    'products:view',
    'cash:view',
    'cash:register_movement',
    'cash:close_day',
  ],
}

// Helper: Verificar si un rol tiene un permiso
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

// Helper: Verificar múltiples permisos (requiere TODOS)
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

// Helper: Verificar múltiples permisos (requiere AL MENOS UNO)
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

// Rutas accesibles por rol
export const ACCESSIBLE_ROUTES: Record<Role, string[]> = {
  OWNER: [
    '/dashboard',
    '/dashboard/ventas',
    '/dashboard/ventas/nueva',
    '/dashboard/ventas/historial',
    '/dashboard/productos',
    '/dashboard/clientes',
    '/dashboard/clientes/[id]',
    '/dashboard/reportes',
    '/dashboard/inventario',
    '/dashboard/cajas',
    '/dashboard/mi-caja',
    '/dashboard/usuarios',
    '/dashboard/ajustes',
    '/dashboard/admin',
  ],
  ADMIN: [
    '/dashboard',
    '/dashboard/ventas',
    '/dashboard/ventas/nueva',
    '/dashboard/ventas/historial',
    '/dashboard/productos',
    '/dashboard/clientes',
    '/dashboard/clientes/[id]',
    '/dashboard/reportes',
    '/dashboard/inventario',
    '/dashboard/cajas',
    '/dashboard/mi-caja',
    '/dashboard/usuarios',
    '/dashboard/ajustes',
  ],
  GERENTE: [
    '/dashboard',
    '/dashboard/ventas',
    '/dashboard/ventas/nueva',
    '/dashboard/ventas/historial',
    '/dashboard/productos',
    '/dashboard/clientes',
    '/dashboard/clientes/[id]',
    '/dashboard/reportes',
    '/dashboard/inventario',
    '/dashboard/cajas',
    '/dashboard/mi-caja',
    '/dashboard/usuarios',
  ],
  SUPERVISOR: [
    '/dashboard',
    '/dashboard/ventas',
    '/dashboard/ventas/nueva',
    '/dashboard/ventas/historial',
    '/dashboard/productos',
    '/dashboard/clientes',
    '/dashboard/reportes',
    '/dashboard/cajas',
  ],
  VENDEDOR: [
    '/dashboard',
    '/dashboard/ventas/nueva',
    '/dashboard/ventas/historial',
    '/dashboard/clientes',
    '/dashboard/mi-caja',
  ],
}

// Verificar si un rol tiene acceso a una ruta
export function canAccessRoute(role: Role, path: string): boolean {
  const routes = ACCESSIBLE_ROUTES[role]
  return routes.some(route => {
    // Manejo de rutas dinámicas
    const routePattern = route.replace(/\[.*?\]/g, '[^/]+')
    const regex = new RegExp(`^${routePattern}$`)
    return regex.test(path)
  })
}
