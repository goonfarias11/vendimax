"use client";

import { Bell, Search, Menu, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function DashboardTopbar({ onMenuClick }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos, ventas, clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
        </Button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100 transition"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
              {getUserInitials(session?.user?.name)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">{session?.user?.name || "Usuario"}</p>
              <p className="text-xs text-gray-500">{session?.user?.role || "Vendedor"}</p>
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-20">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
