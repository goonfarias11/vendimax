"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const RUBROS = [
  "Almacén / Kiosco",
  "Ropa y Calzado",
  "Electrónica",
  "Farmacia",
  "Ferretería",
  "Librería",
  "Panadería / Pastelería",
  "Carnicería",
  "Verdulería",
  "Restaurante / Bar",
  "Peluquería / Estética",
  "Repuestos Automotor",
  "Otro",
];

export default function OnboardingBusinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "",
    address: "",
    taxId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar la información");
      }

      router.push("/onboarding/done");
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Información de tu Negocio</CardTitle>
          <CardDescription>
            Cuéntanos sobre tu comercio para personalizar tu experiencia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del Negocio *</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Mi Comercio S.A."
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Rubro *</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
                required
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Selecciona tu rubro" />
                </SelectTrigger>
                <SelectContent>
                  {RUBROS.map((rubro) => (
                    <SelectItem key={rubro} value={rubro}>
                      {rubro}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                type="text"
                placeholder="Av. Corrientes 1234, CABA"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <p className="text-xs text-gray-500">Opcional: Aparecerá en tus tickets</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">CUIT / CUIL</Label>
              <Input
                id="taxId"
                type="text"
                placeholder="20-12345678-9"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
              <p className="text-xs text-gray-500">Opcional: Para facturación electrónica</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/onboarding/start")}
                disabled={loading}
              >
                Atrás
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Saltar este paso
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
