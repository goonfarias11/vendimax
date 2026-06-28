"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Wallet,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { canAccessRoute, Role } from "@/lib/permissions";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingCart, label: "Ventas", href: "/dashboard/ventas/nueva" },
  { icon: ShoppingCart, label: "Historial Ventas", href: "/dashboard/ventas/historial" },
  { icon: Package, label: "Productos", href: "/dashboard/productos" },
  { icon: Users, label: "Clientes", href: "/dashboard/clientes" },
  { icon: Wallet, label: "Mi Caja", href: "/dashboard/mi-caja" },
  { icon: BarChart3, label: "Reportes", href: "/dashboard/reportes" },
  { icon: UserCog, label: "Usuarios", href: "/dashboard/usuarios" },
  { icon: Settings, label: "Ajustes", href: "/dashboard/ajustes" },
];

// Mapa de roles a texto en español
const roleLabels: Record<Role, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  GERENTE: "Gerente",
  SUPERVISOR: "Supervisor",
  VENDEDOR: "Vendedor"
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

  const userRole = (session?.user as any)?.role as Role;
  const adminRole = (session?.user as any)?.adminRole as string;

  // Filtrar menú según permisos del rol
  const accessibleMenuItems = menuItems.filter(item => 
    canAccessRoute(userRole, item.href)
  );

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-white transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-white">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">VendiMax</span>
            </Link>
          )}
          
          {/* Botón cerrar en móvil */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Botón collapse en desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "rounded-lg p-1.5 hover:bg-gray-100 hidden md:block",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Menu */}
        <nav className="space-y-1 p-2">
          {accessibleMenuItems.map((item) => {
              const Icon = item.icon;
              // Mejorar lógica de active: exacto o empieza con el href pero solo si no es /dashboard
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard' 
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
        </nav>

        {/* Admin Panel Link */}
        {(adminRole === "super_admin" || adminRole === "admin") && !collapsed && (
          <div className="px-3 py-2">
            <a
              href="/admin"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Panel Admin
            </a>
          </div>
        )}

        {/* User Info */}
        {!collapsed && (
          <div className="absolute bottom-0 w-full border-t bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {session?.user?.name || "Usuario"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {userRole ? roleLabels[userRole] : "Usuario"}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
