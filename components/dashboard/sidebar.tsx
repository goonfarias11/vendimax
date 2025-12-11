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
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingCart, label: "Ventas", href: "/dashboard/ventas" },
  { icon: Package, label: "Productos", href: "/dashboard/productos" },
  { icon: Users, label: "Clientes", href: "/dashboard/clientes" },
  { icon: Wallet, label: "Caja", href: "/dashboard/caja" },
  { icon: BarChart3, label: "Reportes", href: "/dashboard/reportes" },
  { icon: Settings, label: "Ajustes", href: "/dashboard/ajustes", adminOnly: true },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

  const userRole = (session?.user as any)?.role;

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
          {menuItems
            .filter(item => !item.adminOnly || userRole === "ADMIN")
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

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
                  {userRole === "ADMIN" ? "Administrador" : "Vendedor"}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
