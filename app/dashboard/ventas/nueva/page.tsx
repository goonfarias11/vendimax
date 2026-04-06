"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ScanLine,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  UserRound,
  CheckCircle2,
  Printer,
  Send,
  Keyboard,
  Banknote,
  CreditCard,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ApiProduct = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  price?: number;
  salePrice?: number;
  stock?: number;
  image?: string | null;
  taxRate?: number;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  image: string;
  taxRate: number;
};

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  totalPurchased?: number;
  purchaseCount?: number;
  lastPurchase?: string | null;
};

type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
  taxRate: number;
  subtotal: number;
};

type PaymentMode = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "MIXTO";

type MixedPayments = {
  efectivo: number;
  tarjeta: number;
  transferencia: number;
};

const CONSUMIDOR_FINAL_LABEL = "Consumidor Final";

const safeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(value);

const playScanSound = () => {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.type = "triangle";
    oscillator.frequency.value = 920;
    gain.gain.value = 0.05;

    oscillator.start();
    oscillator.stop(context.currentTime + 0.08);

    setTimeout(() => {
      context.close().catch(() => undefined);
    }, 150);
  } catch {
    // Ignorar errores de audio (navegador o permisos)
  }
};

const mapProduct = (raw: ApiProduct): Product => ({
  id: raw.id,
  name: raw.name,
  sku: raw.sku || "-",
  barcode: raw.barcode || "",
  price: safeNumber(raw.salePrice ?? raw.price),
  stock: safeNumber(raw.stock),
  image: raw.image || "",
  taxRate: safeNumber(raw.taxRate),
});

export default function NuevaVentaPage() {
  const router = useRouter();

  const productInputRef = useRef<HTMLInputElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [showProductResults, setShowProductResults] = useState(false);

  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [showClientResults, setShowClientResults] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<string[]>([]);

  const [discount, setDiscount] = useState(0);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("EFECTIVO");
  const [cashReceived, setCashReceived] = useState(0);
  const [mixedPayments, setMixedPayments] = useState<MixedPayments>({
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
  });

  const [printAfterSale, setPrintAfterSale] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmSaleOpen, setConfirmSaleOpen] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; ticketNumber?: number } | null>(null);

  const itemsCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.subtotal, 0),
    [cart],
  );

  const discountAmount = useMemo(
    () => Math.max(0, Math.min(safeNumber(discount), subtotal)),
    [discount, subtotal],
  );

  const estimatedTax = useMemo(
    () => cart.reduce((sum, item) => sum + (item.subtotal * item.taxRate) / 100, 0),
    [cart],
  );

  const total = useMemo(() => Math.max(0, subtotal - discountAmount + estimatedTax), [subtotal, discountAmount, estimatedTax]);

  const mixedTotal = useMemo(
    () => safeNumber(mixedPayments.efectivo) + safeNumber(mixedPayments.tarjeta) + safeNumber(mixedPayments.transferencia),
    [mixedPayments],
  );

  const mixedDiff = useMemo(() => Math.abs(mixedTotal - total), [mixedTotal, total]);

  const change = useMemo(() => {
    if (paymentMode !== "EFECTIVO") return 0;
    return Math.max(0, safeNumber(cashReceived) - total);
  }, [cashReceived, paymentMode, total]);

  const clearSale = useCallback((withConfirm = false) => {
    if (withConfirm) {
      const confirmed = window.confirm("Cancelar venta actual y vaciar carrito?");
      if (!confirmed) return;
    }

    setCart([]);
    setDiscount(0);
    setSelectedClient(null);
    setCashReceived(0);
    setMixedPayments({ efectivo: 0, tarjeta: 0, transferencia: 0 });
    setLastSale(null);
    setProductQuery("");
    setClientQuery("");
    setProductResults([]);
    setClientResults([]);
    setShowProductResults(false);
    setShowClientResults(false);
  }, []);

  const openTicketPreview = useCallback(
    (saleId: string) => {
      router.push(`/dashboard/ticket-preview/${saleId}`);
    },
    [router],
  );

  const sendTicketLink = useCallback(async (saleId: string) => {
    const ticketUrl = `${window.location.origin}/dashboard/ticket-preview/${saleId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Ticket de venta",
          text: "Te comparto el ticket de la venta",
          url: ticketUrl,
        });
      } else {
        await navigator.clipboard.writeText(ticketUrl);
        toast.success("Enlace del ticket copiado");
      }
    } catch {
      toast.error("No se pudo compartir el ticket");
    }
  }, []);

  const addRecentlyAdded = useCallback((productId: string) => {
    setRecentlyAddedIds((prev) => [...prev.filter((id) => id !== productId), productId]);
    window.setTimeout(() => {
      setRecentlyAddedIds((prev) => prev.filter((id) => id !== productId));
    }, 650);
  }, []);

  const addToCart = useCallback(
    (product: Product, fromScanner = false) => {
      if (product.stock <= 0) {
        toast.error("Producto sin stock disponible");
        return;
      }

      setCart((prev) => {
        const existing = prev.find((item) => item.productId === product.id);

        if (existing) {
          if (existing.quantity >= product.stock) {
            toast.error("Stock insuficiente para aumentar cantidad");
            return prev;
          }

          return prev.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotal: (item.quantity + 1) * item.price,
                }
              : item,
          );
        }

        return [
          {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            stock: product.stock,
            image: product.image,
            taxRate: product.taxRate,
            subtotal: product.price,
          },
          ...prev,
        ];
      });

      addRecentlyAdded(product.id);

      if (fromScanner) {
        playScanSound();
      }

      setProductQuery("");
      setProductResults([]);
      setShowProductResults(false);
      productInputRef.current?.focus();
    },
    [addRecentlyAdded],
  );

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    setCart((prev) => {
      if (newQuantity <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }

      return prev.map((item) => {
        if (item.productId !== productId) return item;

        if (newQuantity > item.stock) {
          toast.error("Stock insuficiente");
          return item;
        }

        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.price,
        };
      });
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const fetchProducts = useCallback(async (query: string) => {
    try {
      const params = new URLSearchParams({
        limit: "12",
      });

      if (query.trim()) {
        params.set("search", query.trim());
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        setProductResults([]);
        return;
      }

      const normalized = data
        .map(mapProduct)
        .filter((product: Product) => product.price >= 0)
        .slice(0, 12);

      setProductResults(normalized);
    } catch {
      setProductResults([]);
    }
  }, []);

  const fetchClients = useCallback(async (query: string) => {
    try {
      const params = new URLSearchParams({
        limit: "10",
      });

      if (query.trim()) {
        params.set("search", query.trim());
      }

      const response = await fetch(`/api/clients?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setClientResults([]);
        return;
      }

      const clients = Array.isArray(data) ? data : data.clients;
      if (!Array.isArray(clients)) {
        setClientResults([]);
        return;
      }

      setClientResults(clients);
    } catch {
      setClientResults([]);
    }
  }, []);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      if (!showProductResults) return;
      fetchProducts(productQuery);
    }, 120);

    return () => window.clearTimeout(handler);
  }, [fetchProducts, productQuery, showProductResults]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      if (!showClientResults) return;
      fetchClients(clientQuery);
    }, 150);

    return () => window.clearTimeout(handler);
  }, [clientQuery, fetchClients, showClientResults]);

  const finalizeSale = useCallback(async (confirmedByUser = false) => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto para finalizar");
      return;
    }

    const computedTotal = safeNumber(subtotal) - safeNumber(discountAmount) + safeNumber(estimatedTax);
    const finalTotal = Number(computedTotal.toFixed(2));

    if (finalTotal <= 0) {
      toast.error("El total debe ser mayor a cero");
      return;
    }

    if (paymentMode === "EFECTIVO" && safeNumber(cashReceived) < finalTotal) {
      toast.error("El pago recibido en efectivo es menor al total");
      return;
    }

    if (paymentMode === "MIXTO" && mixedDiff > 0.01) {
      toast.error("En pago mixto, la suma debe coincidir con el total");
      return;
    }

    if (!confirmedByUser) {
      setConfirmSaleOpen(true);
      return;
    }

    setConfirmSaleOpen(false);

    setIsSaving(true);

    try {
      let paymentMethod:
        | "EFECTIVO"
        | "TARJETA_DEBITO"
        | "TRANSFERENCIA"
        | "MIXTO" = "EFECTIVO";

      let hasMixedPayment = false;
      let payments: Array<{ method: string; amount: number; reference: null }> = [];

      if (paymentMode === "TARJETA") {
        paymentMethod = "TARJETA_DEBITO";
      }

      if (paymentMode === "TRANSFERENCIA") {
        paymentMethod = "TRANSFERENCIA";
      }

      if (paymentMode === "MIXTO") {
        paymentMethod = "MIXTO";
        hasMixedPayment = true;

        payments = [
          safeNumber(mixedPayments.efectivo) > 0
            ? { method: "EFECTIVO", amount: safeNumber(mixedPayments.efectivo), reference: null }
            : null,
          safeNumber(mixedPayments.tarjeta) > 0
            ? { method: "TARJETA_DEBITO", amount: safeNumber(mixedPayments.tarjeta), reference: null }
            : null,
          safeNumber(mixedPayments.transferencia) > 0
            ? { method: "TRANSFERENCIA", amount: safeNumber(mixedPayments.transferencia), reference: null }
            : null,
        ].filter(Boolean) as Array<{ method: string; amount: number; reference: null }>;
      }

      if (hasMixedPayment && payments.length === 0) {
        toast.error("Agrega al menos un pago válido");
        setIsSaving(false);
        return;
      }

      if (!hasMixedPayment) {
        payments = [
          { method: paymentMethod, amount: finalTotal, reference: null },
        ];
      }

      const payload = {
        clientId: selectedClient?.id || null,
        paymentMethod,
        hasMixedPayment,
        payments,
        total: finalTotal,
        subtotal: safeNumber(subtotal),
        tax: safeNumber(estimatedTax),
        discount: safeNumber(discountAmount),
        discountType: "fixed" as const,
        documentType: "ticket" as const,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: safeNumber(item.quantity),
          unitPrice: safeNumber(item.price),
          subtotal: safeNumber(item.subtotal),
        })),
      };

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(result.error || "No se pudo registrar la venta");
        return;
      }

      setLastSale({
        id: result.id,
        ticketNumber: result.ticketNumber,
      });

      toast.success("Venta completada correctamente");

      setCart([]);
      setDiscount(0);
      setSelectedClient(null);
      setCashReceived(0);
      setMixedPayments({ efectivo: 0, tarjeta: 0, transferencia: 0 });
      setClientQuery("");

      if (printAfterSale && result.id) {
        openTicketPreview(result.id);
      }
    } catch {
      toast.error("Error inesperado al procesar la venta");
    } finally {
      setIsSaving(false);
    }
  }, [
    cart,
    cashReceived,
    discountAmount,
    estimatedTax,
    mixedDiff,
    mixedPayments,
    openTicketPreview,
    paymentMode,
    printAfterSale,
    selectedClient,
    subtotal,
    total,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        setShowProductResults(true);
        productInputRef.current?.focus();
      }

      if (event.key === "F2") {
        event.preventDefault();
        setShowClientResults(true);
        clientInputRef.current?.focus();
      }

      if (event.key === "F3") {
        event.preventDefault();
        void finalizeSale();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        clearSale(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearSale, finalizeSale]);

  return (
    <div className="space-y-5 pb-8">
      <Dialog open={confirmSaleOpen} onOpenChange={setConfirmSaleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar venta</DialogTitle>
            <DialogDescription>
              Revisa los datos antes de registrar la venta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items</span>
              <span className="font-semibold text-gray-900">{itemsCount}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Cliente</span>
              <span className="font-semibold text-gray-900">
                {selectedClient?.name || CONSUMIDOR_FINAL_LABEL}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Metodo</span>
              <span className="font-semibold text-gray-900">{paymentMode}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSaleOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => void finalizeSale(true)}
              disabled={isSaving}
            >
              {isSaving ? "Procesando..." : "Confirmar y finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <Badge className="h-9 rounded-full bg-blue-100 px-4 text-blue-700 hover:bg-blue-100">
            <ShoppingCart className="mr-2 h-4 w-4" />
            {itemsCount} items
          </Badge>
          <Button variant="outline" className="h-10" onClick={() => router.push("/dashboard/ventas")}>
            Salir
          </Button>
        </div>
      </div>

      {lastSale && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">
                Venta completada #{lastSale.ticketNumber || lastSale.id.slice(-6)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                className="h-10 bg-blue-600 hover:bg-blue-700"
                onClick={() => openTicketPreview(lastSale.id)}
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir ticket
              </Button>
              <Button
                className="h-10 bg-sky-600 hover:bg-sky-700"
                onClick={() => sendTicketLink(lastSale.id)}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanLine className="h-5 w-5 text-blue-600" />
            1. Buscador de Productos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <Input
              ref={productInputRef}
              value={productQuery}
              onChange={(event) => {
                setProductQuery(event.target.value);
                setShowProductResults(true);
              }}
              onFocus={() => {
                setShowProductResults(true);
                if (!productResults.length) {
                  void fetchProducts(productQuery);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();

                  const needle = productQuery.trim().toLowerCase();
                  if (!needle) return;

                  const exactBarcode = productResults.find(
                    (item) => item.barcode && item.barcode.toLowerCase() === needle,
                  );

                  const exactSku = productResults.find(
                    (item) => item.sku && item.sku.toLowerCase() === needle,
                  );

                  const product = exactBarcode || exactSku || (productResults.length === 1 ? productResults[0] : null);

                  if (product) {
                    addToCart(product, true);
                  } else {
                    toast.error("No se encontro un producto exacto para ese codigo");
                  }
                }
              }}
              placeholder="Buscar por nombre o escanear codigo de barras..."
              className="h-12 pl-10 text-base"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <Keyboard className="h-4 w-4" />
            <span>F1 buscar producto</span>
            <span>•</span>
            <span>F2 cliente</span>
            <span>•</span>
            <span>F3 finalizar</span>
            <span>•</span>
            <span>ESC cancelar</span>
          </div>

          {showProductResults && productResults.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {productResults.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onMouseDown={() => addToCart(product, false)}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">Sin foto</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                    <p className="truncate text-xs text-gray-500">{product.barcode || product.sku}</p>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-700">{formatCurrency(product.price)}</span>
                      <span className={product.stock > 0 ? "text-emerald-600" : "text-red-600"}>
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound className="h-5 w-5 text-blue-600" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                Cliente actual: <strong>{selectedClient?.name || CONSUMIDOR_FINAL_LABEL}</strong>
              </div>

              <div className="relative">
                <Input
                  ref={clientInputRef}
                  value={clientQuery}
                  onChange={(event) => {
                    setClientQuery(event.target.value);
                    setShowClientResults(true);
                  }}
                  onFocus={() => {
                    setShowClientResults(true);
                    if (!clientResults.length) {
                      void fetchClients(clientQuery);
                    }
                  }}
                  placeholder="Buscar por nombre, email o telefono"
                  className="h-11"
                />
              </div>

              {showClientResults && clientResults.length > 0 && (
                <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200">
                  {clientResults.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onMouseDown={() => {
                        setSelectedClient(client);
                        setClientQuery(client.name);
                        setShowClientResults(false);
                      }}
                      className="flex w-full items-start justify-between border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.email || client.phone || "Sin contacto"}</p>
                      </div>
                      <p className="text-xs text-blue-600">{client.purchaseCount || 0} compras</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientQuery("");
                    setShowClientResults(false);
                  }}
                >
                  Usar Consumidor Final
                </Button>
              </div>

              {selectedClient && (
                <div className="grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Total gastado</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(safeNumber(selectedClient.totalPurchased))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Compras</p>
                    <p className="font-semibold text-gray-900">{safeNumber(selectedClient.purchaseCount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ultima compra</p>
                    <p className="font-semibold text-gray-900">
                      {selectedClient.lastPurchase
                        ? new Date(selectedClient.lastPurchase).toLocaleDateString("es-AR")
                        : "Sin compras"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  2. Carrito de Venta
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="h-8 px-3">
                    {itemsCount} items
                  </Badge>
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-8"
                    disabled={cart.length === 0}
                    onClick={() => clearSale(true)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Vaciar carrito
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-gray-500">
                  El carrito esta vacio. Escanea o busca productos para empezar.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-3 text-left">Producto</th>
                        <th className="px-3 py-3 text-right">Precio unitario</th>
                        <th className="px-3 py-3 text-center">Cantidad</th>
                        <th className="px-3 py-3 text-right">Subtotal</th>
                        <th className="px-3 py-3 text-center">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => {
                        const highlight = recentlyAddedIds.includes(item.productId);
                        return (
                          <tr
                            key={item.id}
                            className={`border-t transition ${
                              highlight ? "bg-emerald-50 duration-500" : "bg-white"
                            }`}
                          >
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 overflow-hidden rounded bg-gray-100">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-[10px] text-gray-400">N/A</div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-xs text-gray-500">Stock: {item.stock}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-gray-900">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="inline-flex w-10 justify-center rounded border border-gray-200 bg-white py-1 text-center font-semibold">
                                  {item.quantity}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => removeFromCart(item.productId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit xl:sticky xl:top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">3. Resumen y Cobro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Descuento</span>
                <span>- {formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>IVA estimado</span>
                <span>{formatCurrency(estimatedTax)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xl font-bold text-gray-900">
                <span>TOTAL</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Descuento (monto fijo)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={discount || ""}
                onChange={(event) => setDiscount(safeNumber(event.target.value))}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Metodo de pago</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMode === "EFECTIVO" ? "default" : "outline"}
                  className={paymentMode === "EFECTIVO" ? "h-11 bg-blue-600 hover:bg-blue-700" : "h-11"}
                  onClick={() => setPaymentMode("EFECTIVO")}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Efectivo
                </Button>
                <Button
                  type="button"
                  variant={paymentMode === "TARJETA" ? "default" : "outline"}
                  className={paymentMode === "TARJETA" ? "h-11 bg-blue-600 hover:bg-blue-700" : "h-11"}
                  onClick={() => setPaymentMode("TARJETA")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Tarjeta
                </Button>
                <Button
                  type="button"
                  variant={paymentMode === "TRANSFERENCIA" ? "default" : "outline"}
                  className={paymentMode === "TRANSFERENCIA" ? "h-11 bg-blue-600 hover:bg-blue-700" : "h-11"}
                  onClick={() => setPaymentMode("TRANSFERENCIA")}
                >
                  <Landmark className="mr-2 h-4 w-4" />
                  Transferencia
                </Button>
                <Button
                  type="button"
                  variant={paymentMode === "MIXTO" ? "default" : "outline"}
                  className={paymentMode === "MIXTO" ? "h-11 bg-blue-600 hover:bg-blue-700" : "h-11"}
                  onClick={() => setPaymentMode("MIXTO")}
                >
                  Mixto
                </Button>
              </div>
            </div>

            {paymentMode === "EFECTIVO" && (
              <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                <Label htmlFor="cashReceived">Pago recibido</Label>
                <Input
                  id="cashReceived"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashReceived || ""}
                  onChange={(event) => setCashReceived(safeNumber(event.target.value))}
                  className="h-11"
                />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Vuelto</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(change)}</span>
                </div>
              </div>
            )}

            {paymentMode === "MIXTO" && (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium text-gray-700">Distribucion del pago mixto</p>

                <div className="space-y-2">
                  <Label htmlFor="mixCash">Efectivo</Label>
                  <Input
                    id="mixCash"
                    type="number"
                    min="0"
                    step="0.01"
                    value={mixedPayments.efectivo || ""}
                    onChange={(event) =>
                      setMixedPayments((prev) => ({ ...prev, efectivo: safeNumber(event.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mixCard">Tarjeta</Label>
                  <Input
                    id="mixCard"
                    type="number"
                    min="0"
                    step="0.01"
                    value={mixedPayments.tarjeta || ""}
                    onChange={(event) =>
                      setMixedPayments((prev) => ({ ...prev, tarjeta: safeNumber(event.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mixTransfer">Transferencia</Label>
                  <Input
                    id="mixTransfer"
                    type="number"
                    min="0"
                    step="0.01"
                    value={mixedPayments.transferencia || ""}
                    onChange={(event) =>
                      setMixedPayments((prev) => ({ ...prev, transferencia: safeNumber(event.target.value) }))
                    }
                  />
                </div>

                <div className="rounded bg-gray-50 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Total cargado</span>
                    <span className="font-semibold">{formatCurrency(mixedTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Diferencia</span>
                    <span className={mixedDiff <= 0.01 ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                      {formatCurrency(total - mixedTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={printAfterSale}
                onChange={(event) => setPrintAfterSale(event.target.checked)}
                className="h-4 w-4"
              />
              Imprimir ticket al finalizar
            </label>

            <Button
              type="button"
              onClick={() => void finalizeSale()}
              disabled={isSaving || cart.length === 0}
              className="h-14 w-full bg-emerald-600 text-base font-bold hover:bg-emerald-700"
            >
              {isSaving ? "Procesando..." : "FINALIZAR VENTA"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => clearSale(true)}
            >
              Cancelar venta (ESC)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
