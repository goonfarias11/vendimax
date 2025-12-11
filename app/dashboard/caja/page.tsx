"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, LayoutDashboard } from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { CloseCashRegisterDialog } from "@/components/dashboard/close-cash-register-dialog";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface CashMovement {
  id: string;
  type: "APERTURA" | "CIERRE" | "INGRESO" | "EGRESO";
  amount: number;
  description: string | null;
  reference: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface Totals {
  ingresos: number;
  egresos: number;
  balance: number;
}

export default function CajaPage() {
  const { data: session } = useSession();
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [totals, setTotals] = useState<Totals>({ ingresos: 0, egresos: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [showCloseCashDialog, setShowCloseCashDialog] = useState(false);
  const [showNewMovementModal, setShowNewMovementModal] = useState(false);

  // Cargar movimientos
  const fetchMovements = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/cash-movements?startDate=${today}T00:00:00&endDate=${today}T23:59:59`);
      
      if (!response.ok) throw new Error("Error al cargar movimientos");
      
      const data = await response.json();
      setMovements(data.movements);
      setTotals(data.totals);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar movimientos de caja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      APERTURA: "Apertura",
      CIERRE: "Cierre",
      INGRESO: "Ingreso",
      EGRESO: "Egreso",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Caja</h1>
          <p className="text-gray-600">Control de ingresos y egresos</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowCloseCashDialog(true)}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Cerrar Caja
          </Button>
          <Button onClick={() => setShowNewMovementModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando movimientos...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Saldo Actual"
              value={`$${totals.balance.toLocaleString()}`}
              icon={<Wallet className="h-6 w-6" />}
            />
            <KPICard
              title="Ingresos Hoy"
              value={`$${totals.ingresos.toLocaleString()}`}
              trend="up"
              icon={<TrendingUp className="h-6 w-6" />}
            />
            <KPICard
              title="Egresos Hoy"
              value={`$${totals.egresos.toLocaleString()}`}
              trend="down"
              icon={<TrendingDown className="h-6 w-6" />}
            />
            <KPICard
              title="Balance"
              value={`$${totals.balance.toLocaleString()}`}
              trend={totals.balance >= 0 ? "up" : "down"}
              icon={<DollarSign className="h-6 w-6" />}
            />
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold text-gray-900">Movimientos de Hoy</h2>
            </div>
            <div className="p-6">
              {movements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay movimientos registrados hoy
                </div>
              ) : (
                <div className="space-y-4">
                  {movements.map((mov) => {
                    const isPositive = mov.type === "INGRESO" || mov.type === "APERTURA";
                    const amount = Number(mov.amount);
                    
                    return (
                      <div
                        key={mov.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              isPositive
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="h-5 w-5" />
                            ) : (
                              <TrendingDown className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {getMovementTypeLabel(mov.type)}
                              </p>
                              {mov.reference && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  {mov.reference}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {mov.description || "Sin descripción"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(mov.createdAt)} • {mov.user.name}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-lg font-semibold ${
                            isPositive ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isPositive ? "+" : "-"}${amount.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Dialog Cerrar Caja */}
      <CloseCashRegisterDialog
        isOpen={showCloseCashDialog}
        onClose={() => setShowCloseCashDialog(false)}
        onSuccess={() => {
          fetchMovements()
          setShowCloseCashDialog(false)
        }}
      />
    </div>
  );
}
