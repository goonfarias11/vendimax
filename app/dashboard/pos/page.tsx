import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { POSInterface } from "@/components/pos-interface";

export default async function POSPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Punto de Venta</h1>
        <p className="text-muted-foreground">Sistema de ventas rápido y eficiente</p>
      </div>
      <POSInterface />
    </div>
  );
}
