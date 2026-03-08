"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Save,
  Upload,
  Settings,
  Shield,
  Receipt,
  MapPin,
  Percent,
  Printer,
  FileText,
  Plus,
  Edit,
  Trash2,
  Check,
  X
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { toast } from "sonner";

type BusinessSettings = {
  nombreComercio: string;
  cuit: string;
  direccion: string;
  telefono: string;
  email: string;
  logo: string;
  stockMinimoGlobal: number;
};

type AfipConfig = {
  id?: string;
  cuit: string;
  razonSocial: string;
  production: boolean;
  isActive: boolean;
};

type PointOfSale = {
  id?: string;
  number: number;
  name: string;
  emissionType: string;
  isActive: boolean;
};

type Branch = {
  id?: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isActive: boolean;
  isMain: boolean;
};

type TaxConfig = {
  defaultTaxRate: number;
  taxIncludedInPrice: boolean;
};

type PrinterConfig = {
  name: string;
  type: 'thermal' | 'standard';
  width: number;
  autoOpen: boolean;
};

export default function AjustesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Estado para cada sección
  const [settings, setSettings] = useState<BusinessSettings>({
    nombreComercio: "",
    cuit: "",
    direccion: "",
    telefono: "",
    email: "",
    logo: "",
    stockMinimoGlobal: 5,
  });

  const [afipConfig, setAfipConfig] = useState<AfipConfig>({
    cuit: "",
    razonSocial: "",
    production: false,
    isActive: false,
  });

  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [taxConfig, setTaxConfig] = useState<TaxConfig>({
    defaultTaxRate: 21,
    taxIncludedInPrice: true,
  });

  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    name: "",
    type: 'thermal',
    width: 80,
    autoOpen: true,
  });

  const [receiptSettings, setReceiptSettings] = useState({
    header: "",
    footer: "Gracias por su compra",
    showLogo: true,
  });

  // Verificar permisos
  const canEditSettings = session?.user?.role 
    ? hasPermission(session.user.role as any, 'settings:edit_business')
    : false;

  useEffect(() => {
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
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      setLoading(true);
      
      // Cargar configuración general
      const savedSettings = localStorage.getItem("businessSettings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      // Cargar configuración AFIP
      const afipResponse = await fetch('/api/afip/config');
      if (afipResponse.ok) {
        const afipData = await afipResponse.json();
        if (afipData) {
          setAfipConfig(afipData);
        }
      }

      // Cargar puntos de venta
      const posResponse = await fetch('/api/afip/points-of-sale');
      if (posResponse.ok) {
        const posData = await posResponse.json();
        setPointsOfSale(posData);
      }

      // Cargar sucursales
      const branchesResponse = await fetch('/api/branches');
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData);
      }

      // Cargar configuración de impuestos
      const savedTaxConfig = localStorage.getItem("taxConfig");
      if (savedTaxConfig) {
        setTaxConfig(JSON.parse(savedTaxConfig));
      }

      // Cargar configuración de impresora
      const savedPrinterConfig = localStorage.getItem("printerConfig");
      if (savedPrinterConfig) {
        setPrinterConfig(JSON.parse(savedPrinterConfig));
      }

      // Cargar configuración de comprobantes
      const savedReceiptSettings = localStorage.getItem("receiptSettings");
      if (savedReceiptSettings) {
        setReceiptSettings(JSON.parse(savedReceiptSettings));
      }

    } catch (error) {
      console.error("Error al cargar configuración:", error);
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);
      localStorage.setItem("businessSettings", JSON.stringify(settings));
      toast.success("Configuración general guardada");
    } catch (error) {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAfip = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/afip/config', {
        method: afipConfig.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(afipConfig)
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración AFIP');
      }

      const data = await response.json();
      setAfipConfig(data);
      toast.success("Configuración AFIP guardada");
    } catch (error) {
      toast.error("Error al guardar configuración AFIP");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTaxes = async () => {
    try {
      setSaving(true);
      localStorage.setItem("taxConfig", JSON.stringify(taxConfig));
      toast.success("Configuración de impuestos guardada");
    } catch (error) {
      toast.error("Error al guardar configuración de impuestos");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReceipt = async () => {
    try {
      setSaving(true);
      localStorage.setItem("receiptSettings", JSON.stringify(receiptSettings));
      toast.success("Configuración de comprobantes guardada");
    } catch (error) {
      toast.error("Error al guardar configuración de comprobantes");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrinter = async () => {
    try {
      setSaving(true);
      localStorage.setItem("printerConfig", JSON.stringify(printerConfig));
      toast.success("Configuración de impresora guardada");
    } catch (error) {
      toast.error("Error al guardar configuración de impresora");
    } finally {
      setSaving(false);
    }
  };

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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session?.user && !canEditSettings)) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ajustes del Sistema</h1>
          <p className="text-gray-600">Configura todos los aspectos de tu negocio</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="afip" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">AFIP</span>
          </TabsTrigger>
          <TabsTrigger value="branches" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Sucursales</span>
          </TabsTrigger>
          <TabsTrigger value="taxes" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Impuestos</span>
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Comprobantes</span>
          </TabsTrigger>
          <TabsTrigger value="printers" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Impresoras</span>
          </TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general" className="space-y-6">
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

              <div>
                <Label htmlFor="stockMinimoGlobal">Stock Mínimo Global</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Valor por defecto para nuevos productos
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
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveGeneral} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </Card>

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
        </TabsContent>

        {/* AFIP */}
        <TabsContent value="afip" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Configuración AFIP</h2>
                <p className="text-sm text-gray-500">Facturación electrónica con AFIP</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="afipCuit">CUIT *</Label>
                  <Input
                    id="afipCuit"
                    value={afipConfig.cuit}
                    onChange={(e) => setAfipConfig({ ...afipConfig, cuit: e.target.value })}
                    placeholder="20-12345678-9"
                  />
                </div>
                <div>
                  <Label htmlFor="afipRazonSocial">Razón Social *</Label>
                  <Input
                    id="afipRazonSocial"
                    value={afipConfig.razonSocial}
                    onChange={(e) => setAfipConfig({ ...afipConfig, razonSocial: e.target.value })}
                    placeholder="Mi Empresa S.A."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="afipProduction">Modo Producción</Label>
                  <p className="text-sm text-gray-500">
                    Activa para usar el servicio real de AFIP (requiere certificado)
                  </p>
                </div>
                <Switch
                  id="afipProduction"
                  checked={afipConfig.production}
                  onCheckedChange={(checked: boolean) => setAfipConfig({ ...afipConfig, production: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="afipActive">Activo</Label>
                  <p className="text-sm text-gray-500">
                    Permite generar facturas electrónicas
                  </p>
                </div>
                <Switch
                  id="afipActive"
                  checked={afipConfig.isActive}
                  onCheckedChange={(checked: boolean) => setAfipConfig({ ...afipConfig, isActive: checked })}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveAfip} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Guardar AFIP"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Puntos de Venta</h3>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Punto de Venta
              </Button>
            </div>
            
            {pointsOfSale.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No hay puntos de venta configurados</p>
                <p className="text-sm">Agrega un punto de venta para comenzar a facturar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pointsOfSale.map((pos) => (
                  <div key={pos.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{pos.name}</p>
                      <p className="text-sm text-gray-500">Número: {pos.number}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pos.isActive ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Activo</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inactivo</span>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* SUCURSALES */}
        <TabsContent value="branches" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Sucursales</h2>
                  <p className="text-sm text-gray-500">Gestiona las sucursales de tu negocio</p>
                </div>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sucursal
              </Button>
            </div>

            {branches.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No hay sucursales registradas</p>
                <p className="text-sm mb-4">Crea tu primera sucursal para comenzar</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Sucursal
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {branches.map((branch) => (
                  <div key={branch.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{branch.name}</h3>
                          {branch.isMain && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Principal</span>
                          )}
                          {branch.isActive ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Activa</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inactiva</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Código: {branch.code}</p>
                        {branch.address && (
                          <p className="text-sm text-gray-600">Dirección: {branch.address}</p>
                        )}
                        {branch.phone && (
                          <p className="text-sm text-gray-600">Teléfono: {branch.phone}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* IMPUESTOS */}
        <TabsContent value="taxes" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Percent className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Configuración de Impuestos</h2>
                <p className="text-sm text-gray-500">Define las tasas impositivas para tus productos</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="defaultTaxRate">Tasa de IVA por Defecto (%)</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Se aplicará automáticamente a nuevos productos
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxConfig.defaultTaxRate}
                    onChange={(e) => setTaxConfig({ ...taxConfig, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                    className="max-w-xs"
                  />
                  <span className="text-gray-600">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="taxIncluded">Precios con IVA Incluido</Label>
                  <p className="text-sm text-gray-500">
                    Los precios mostrados ya incluyen el impuesto
                  </p>
                </div>
                <Switch
                  id="taxIncluded"
                  checked={taxConfig.taxIncludedInPrice}
                  onCheckedChange={(checked: boolean) => setTaxConfig({ ...taxConfig, taxIncludedInPrice: checked })}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Tasas de IVA Comunes en Argentina</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>21%</strong> - Tasa general</li>
                  <li>• <strong>10.5%</strong> - Tasa reducida (alimentos, medicamentos)</li>
                  <li>• <strong>27%</strong> - Tasa incrementada (servicios digitales, telecomunicaciones)</li>
                  <li>• <strong>0%</strong> - Exento (libros, productos de primera necesidad)</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveTaxes} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* COMPROBANTES */}
        <TabsContent value="receipts" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Personalización de Comprobantes</h2>
                <p className="text-sm text-gray-500">Configura cómo se verán tus tickets y facturas</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="showLogo">Mostrar Logo en Comprobantes</Label>
                  <p className="text-sm text-gray-500">
                    Incluye el logo del negocio en tickets y facturas
                  </p>
                </div>
                <Switch
                  id="showLogo"
                  checked={receiptSettings.showLogo}
                  onCheckedChange={(checked: boolean) => setReceiptSettings({ ...receiptSettings, showLogo: checked })}
                />
              </div>

              <div>
                <Label htmlFor="receiptHeader">Encabezado del Comprobante</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Texto que aparecerá en la parte superior (opcional)
                </p>
                <Textarea
                  id="receiptHeader"
                  value={receiptSettings.header}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, header: e.target.value })}
                  placeholder="Ej: ¡Bienvenido a nuestro negocio!"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="receiptFooter">Pie del Comprobante</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Texto que aparecerá en la parte inferior
                </p>
                <Textarea
                  id="receiptFooter"
                  value={receiptSettings.footer}
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, footer: e.target.value })}
                  placeholder="Gracias por su compra"
                  rows={3}
                />
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <h4 className="font-medium mb-3">Vista Previa</h4>
                <div className="border-2 border-dashed border-gray-300 rounded p-4 max-w-md mx-auto bg-gray-50">
                  <div className="text-center space-y-2">
                    {receiptSettings.showLogo && settings.logo && (
                      <div className="flex justify-center mb-4">
                        <img src={settings.logo} alt="Logo" className="h-16 w-16 object-contain" />
                      </div>
                    )}
                    <p className="font-bold">{settings.nombreComercio || "Mi Negocio"}</p>
                    {settings.cuit && <p className="text-xs">CUIT: {settings.cuit}</p>}
                    {receiptSettings.header && (
                      <p className="text-sm italic border-t pt-2 mt-2">{receiptSettings.header}</p>
                    )}
                    <div className="border-t border-b py-3 my-3">
                      <p className="text-xs text-gray-600">--- Detalle de la venta ---</p>
                    </div>
                    {receiptSettings.footer && (
                      <p className="text-sm border-t pt-2">{receiptSettings.footer}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveReceipt} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* IMPRESORAS */}
        <TabsContent value="printers" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Printer className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Configuración de Impresoras</h2>
                <p className="text-sm text-gray-500">Configura la impresión de tickets y comprobantes</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="printerName">Nombre de la Impresora</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Nombre exacto de la impresora configurada en el sistema
                </p>
                <Input
                  id="printerName"
                  value={printerConfig.name}
                  onChange={(e) => setPrinterConfig({ ...printerConfig, name: e.target.value })}
                  placeholder="Ej: EPSON TM-T20"
                />
              </div>

              <div>
                <Label htmlFor="printerType">Tipo de Impresora</Label>
                <Select
                  value={printerConfig.type}
                  onValueChange={(value: 'thermal' | 'standard') => setPrinterConfig({ ...printerConfig, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">Térmica (58mm o 80mm)</SelectItem>
                    <SelectItem value="standard">Estándar (A4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="printerWidth">Ancho de Papel (mm)</Label>
                <Select
                  value={printerConfig.width.toString()}
                  onValueChange={(value) => setPrinterConfig({ ...printerConfig, width: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el ancho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">58mm</SelectItem>
                    <SelectItem value="80">80mm</SelectItem>
                    <SelectItem value="210">A4 (210mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="autoOpen">Abrir Cajón Automáticamente</Label>
                  <p className="text-sm text-gray-500">
                    Envía comando para abrir el cajón al imprimir
                  </p>
                </div>
                <Switch
                  id="autoOpen"
                  checked={printerConfig.autoOpen}
                  onCheckedChange={(checked: boolean) => setPrinterConfig({ ...printerConfig, autoOpen: checked })}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">📝 Nota Importante</h4>
                <p className="text-sm text-yellow-800">
                  La impresión directa requiere configuración adicional en el navegador o el uso de una aplicación local.
                  Para entornos web, considera usar plugins específicos o servicios de impresión en la nube.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Prueba
              </Button>
              <Button onClick={handleSavePrinter} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
