"use client";

import { Button } from "@/components/ui/button";
import { User, Bell, Shield, Palette, Database } from "lucide-react";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Personaliza tu sistema VendiMax</p>
      </div>

      <div className="grid gap-6">
        {/* Perfil */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Perfil de Usuario</h2>
              <p className="text-sm text-gray-600">Información personal y credenciales</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                defaultValue="Admin"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                defaultValue="admin@vendimax.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button>Guardar Cambios</Button>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
              <p className="text-sm text-gray-600">Configura tus alertas y notificaciones</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Notificar ventas nuevas", checked: true },
              { label: "Alertas de stock bajo", checked: true },
              { label: "Reportes diarios por email", checked: false },
              { label: "Notificar nuevos clientes", checked: true },
            ].map((item, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={item.checked}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Seguridad */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
              <p className="text-sm text-gray-600">Gestiona la seguridad de tu cuenta</p>
            </div>
          </div>
          <div className="space-y-3">
            <Button variant="outline">Cambiar Contraseña</Button>
            <Button variant="outline" className="ml-2">
              Autenticación de Dos Factores
            </Button>
          </div>
        </div>

        {/* Apariencia */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Apariencia</h2>
              <p className="text-sm text-gray-600">Personaliza la interfaz</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
            <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option>Claro</option>
              <option>Oscuro</option>
              <option>Sistema</option>
            </select>
          </div>
        </div>

        {/* Base de Datos */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Datos y Respaldo</h2>
              <p className="text-sm text-gray-600">Gestiona tus datos</p>
            </div>
          </div>
          <div className="space-y-3">
            <Button variant="outline">Exportar Datos</Button>
            <Button variant="outline" className="ml-2">
              Crear Respaldo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
