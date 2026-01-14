"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Timeout de seguridad para loading infinito (10 segundos)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "loading") {
        setLoadingTimeout(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [status]);

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Pantalla de error si el timeout se cumplió
  if (loadingTimeout && status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error de Conexión
          </h1>
          <p className="text-gray-600 mb-6">
            No se pudo cargar la sesión. Por favor, intenta nuevamente.
          </p>
          <Button
            onClick={() => {
              setLoadingTimeout(false);
              router.push("/login");
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Volver al Login
          </Button>
        </div>
      </div>
    );
  }

  // Estado de carga normal
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Cargando sesión...</p>
          <p className="text-gray-400 text-sm mt-2">Por favor espera</p>
        </div>
      </div>
    );
  }

  // Sin sesión (ya está redirigiendo)
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="print:hidden">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="md:pl-64 print:pl-0">
        <div className="print:hidden">
          <DashboardTopbar onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <main className="p-6 print:p-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
