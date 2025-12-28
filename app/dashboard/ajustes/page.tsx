"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Save, 
  Upload,
  Settings,
  Shield
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/permissions";

type BusinessSettings = {
  nombreComercio: string;
  cuit: string;
  direccion: string;
  telefono: string;
  email: string;
  logo: string;
  stockMinimoGlobal: number;
};

export default function AjustesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>({
    nombreComercio: "",
    cuit: "",
    direccion: "",
    telefono: "",
    email: "",
    logo: "",
    stockMinimoGlobal: 5,
  });

  // Verificar permisos
  const canEditSettings = session?.user?.role 
    ? hasPermission(session.user.role as any, 'settings:edit_business')
    : false;

  useEffect(() => {
    // Verificar permisos de acceso solo cuando la sesión esté cargada
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (session?.user && !canEditSettings) {
      router.push("/dashboard");
    }
  }, [session, status, router, canEditSettings]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Por ahora usamos valores por defecto
      // En producción, estos valores se guardarían en una tabla BusinessSettings
      const defaultSettings: BusinessSettings = {
        nombreComercio: "Mi Negocio",
        cuit: "",
        direccion: "",
        telefono: "",
        email: "",
        logo: "",
        stockMinimoGlobal: 5,
      };
      setSettings(defaultSettings);
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Guardar en localStorage por ahora
      // En producción, esto se guardaría en la base de datos
      localStorage.setItem("businessSettings", JSON.stringify(settings));
      
      alert("Configuración guardada exitosamente");
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  // Protección: no renderizar si no tiene permisos
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session?.user && !canEditSettings)) {
    return null;
  }

  // Estado de carga de datos
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ajustes del Negocio</h1>
          <p className="text-gray-600">Configura la información de tu negocio</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {/* Información del Negocio */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Información del Negocio</h2>
            <p className="text-sm text-gray-500">Datos que aparecerán en facturas y reportes</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombreComercio">Nombre del Comercio *</Label>
              <Input
                id="nombreComercio"
                value={settings.nombreComercio}
                onChange={(e) => setSettings({ ...settings, nombreComercio: e.target.value })}
                placeholder="Mi Negocio SA"
              />
            </div>
            <div>
              <Label htmlFor="cuit">CUIT / RUC</Label>
              <Input
                id="cuit"
                value={settings.cuit}
                onChange={(e) => setSettings({ ...settings, cuit: e.target.value })}
                placeholder="20-12345678-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={settings.direccion}
              onChange={(e) => setSettings({ ...settings, direccion: e.target.value })}
              placeholder="Av. Principal 1234, Ciudad"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={settings.telefono}
                onChange={(e) => setSettings({ ...settings, telefono: e.target.value })}
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="contacto@minegocio.com"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Logo */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo del Negocio</h2>
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <Label htmlFor="logo">Subir Logo</Label>
            <p className="text-sm text-gray-500 mb-3">
              Tamaño recomendado: 200x200px. Formatos: JPG, PNG
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <label htmlFor="logo" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Seleccionar Archivo
                </label>
              </Button>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>
          {settings.logo && (
            <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
              <img
                src={settings.logo}
                alt="Logo del negocio"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Configuración de Inventario */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Configuración de Inventario</h2>
            <p className="text-sm text-gray-500">Parámetros generales para tus productos</p>
          </div>
        </div>

        <div>
          <Label htmlFor="stockMinimoGlobal">Stock Mínimo Global</Label>
          <p className="text-sm text-gray-500 mb-3">
            Valor por defecto para nuevos productos. Puedes ajustarlo individualmente en cada producto.
          </p>
          <Input
            id="stockMinimoGlobal"
            type="number"
            min="0"
            value={settings.stockMinimoGlobal}
            onChange={(e) => setSettings({ ...settings, stockMinimoGlobal: parseInt(e.target.value) || 0 })}
            className="max-w-xs"
          />
        </div>
      </Card>

      {/* Información sobre funcionalidades futuras */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Próximamente</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Configuración de impuestos y tasas</li>
          <li>• Personalización de comprobantes</li>
          <li>• Integración con facturación electrónica</li>
          <li>• Gestión de múltiples sucursales</li>
          <li>• Configuración de impresoras</li>
        </ul>
      </Card>

      {/* Botón de guardar al final */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-5 w-5" />
          {saving ? "Guardando..." : "Guardar Todos los Cambios"}
        </Button>
      </div>
    </div>
  );
}
