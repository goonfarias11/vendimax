"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Minus, Trash2, Calculator, DollarSign, CreditCard, Banknote, User, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Product {
  id: string;
  name: string;
  sku: string;
  salePrice: number;
  stock: number;
  hasVariants: boolean;
  variants?: ProductVariant[];
}

interface ProductVariant {
  id: string;
  name: string;
  salePrice: number;
  stock: number;
}

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Client {
  id: string;
  name: string;
  creditLimit: number;
  currentDebt: number;
}

interface Payment {
  method: "EFECTIVO" | "TARJETA_DEBITO" | "TARJETA_CREDITO" | "TRANSFERENCIA" | "QR" | "CUENTA_CORRIENTE";
  amount: number;
  reference?: string;
}

export function POSInterface() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Payment>({
    method: "EFECTIVO",
    amount: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = discountType === "percentage" ? (subtotal * discount) / 100 : discount;
  const total = Math.max(0, subtotal - discountAmount);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;
  const change = totalPaid > total ? totalPaid - total : 0;

  // Buscar productos
  useEffect(() => {
    if (searchQuery.length >= 2) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error al buscar productos:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  const addToCart = (product: Product, variant?: ProductVariant) => {
    const itemId = variant ? variant.id : product.id;
    const existingItem = cart.find(
      (item) => item.productId === product.id && item.variantId === variant?.id
    );

    if (existingItem) {
      updateQuantity(existingItem.productId, existingItem.quantity + 1, variant?.id);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        variantId: variant?.id,
        name: variant ? `${product.name} - ${variant.name}` : product.name,
        price: variant ? variant.salePrice : product.salePrice,
        quantity: 1,
        subtotal: variant ? variant.salePrice : product.salePrice,
      };
      setCart([...cart, newItem]);
    }

    setSearchQuery("");
    setProducts([]);
    searchInputRef.current?.focus();
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity, subtotal: item.price * quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(cart.filter((item) => !(item.productId === productId && item.variantId === variantId)));
  };

  const addPayment = () => {
    if (currentPayment.amount <= 0) return;

    setPayments([...payments, currentPayment]);
    setCurrentPayment({ method: "EFECTIVO", amount: 0 });
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    if (payments.length === 0) {
      alert("Debe agregar al menos un método de pago");
      return;
    }

    if (remaining > 0.01) {
      alert(`Faltan $${remaining.toFixed(2)} por pagar`);
      return;
    }

    setIsProcessing(true);

    try {
      const saleData = {
        clientId: selectedClient?.id || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: Number(item.quantity),
          unitPrice: Number(item.price),
          subtotal: Number(item.subtotal),
        })),
        subtotal: Number(subtotal),
        discount: Number(discountAmount),
        discountType,
        total: Number(total),
        paymentMethod: payments.length > 1 ? "MIXTO" : payments[0].method,
        hasMixedPayment: payments.length > 1,
        payments: payments.length > 1 ? payments.map(p => ({
          method: p.method,
          amount: Number(p.amount),
          reference: p.reference
        })) : undefined,
      };

      console.log("Enviando datos de venta:", saleData);

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Error del servidor:", error);
        console.error("Datos enviados:", saleData);
        
        // Mostrar detalles del error si están disponibles
        let errorMessage = error.error || "Error al procesar la venta";
        if (error.details && Array.isArray(error.details)) {
          errorMessage += "\n\nDetalles:\n" + error.details.map((d: any) => 
            `- ${d.field}: ${d.message}`
          ).join("\n");
        }
        
        throw new Error(errorMessage);
      }

      const sale = await res.json();

      // Limpiar todo
      setCart([]);
      setPayments([]);
      setDiscount(0);
      setSelectedClient(null);
      setShowPaymentDialog(false);
      
      alert(`✅ Venta completada - Ticket #${sale.ticketNumber || sale.id.slice(-6)}`);

      // Imprimir ticket (opcional)
      if (confirm("¿Desea imprimir el ticket?")) {
        printTicket(sale);
      }
    } catch (error: any) {
      console.error("Error al completar venta:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const printTicket = (sale: any) => {
    // Implementar lógica de impresión
    window.print();
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      EFECTIVO: "Efectivo",
      TARJETA_DEBITO: "Débito",
      TARJETA_CREDITO: "Crédito",
      TRANSFERENCIA: "Transferencia",
      QR: "QR",
      CUENTA_CORRIENTE: "Cuenta Corriente",
    };
    return labels[method] || method;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      {/* Panel izquierdo - Búsqueda y productos */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Buscar Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {products.length > 0 && (
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-3 hover:bg-accent cursor-pointer">
                    {product.hasVariants ? (
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground mb-2">{product.sku}</div>
                        <div className="space-y-1">
                          {product.variants?.map((variant) => (
                            <div
                              key={variant.id}
                              onClick={() => addToCart(product, variant)}
                              className="flex justify-between items-center p-2 border rounded hover:bg-accent"
                            >
                              <span className="text-sm">{variant.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Stock: {variant.stock}</span>
                                <span className="font-medium">${variant.salePrice.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => addToCart(product)} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.sku}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${product.salePrice.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">Stock: {product.stock}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carrito */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Carrito</CardTitle>
              {selectedClient && (
                <Badge variant="outline" className="text-sm">
                  <User className="w-3 h-3 mr-1" />
                  {selectedClient.name}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Carrito vacío</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={`${item.productId}-${item.variantId || ""}-${index}`} className="flex items-center gap-2 border-b pb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-sm text-muted-foreground">${item.price.toFixed(2)} c/u</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="font-bold w-24 text-right">${item.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panel derecho - Totales y pago */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">$</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Descuento"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Descuento</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (cart.length > 0) {
                  setShowPaymentDialog(true);
                }
              }}
              disabled={cart.length === 0}
            >
              <Receipt className="mr-2 h-5 w-5" />
              Procesar Venta
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                fetchClients();
                setShowClientDialog(true);
              }}
            >
              <User className="mr-2 h-4 w-4" />
              {selectedClient ? selectedClient.name : "Seleccionar Cliente"}
            </Button>

            {cart.length > 0 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  if (confirm("¿Limpiar todo el carrito?")) {
                    setCart([]);
                    setDiscount(0);
                    setSelectedClient(null);
                    setPayments([]);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpiar Carrito
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de selección de cliente */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setSelectedClient(null);
                setShowClientDialog(false);
              }}
            >
              Sin cliente (Venta anónima)
            </Button>
            {clients.map((client) => (
              <Button
                key={client.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedClient(client);
                  setShowClientDialog(false);
                }}
              >
                {client.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>Total a Pagar:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {totalPaid > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg">
                    <span>Pagado:</span>
                    <span className="text-green-600">${totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Restante:</span>
                    <span className={remaining > 0 ? "text-orange-600" : "text-green-600"}>
                      ${remaining.toFixed(2)}
                    </span>
                  </div>
                  {change > 0 && (
                    <div className="flex justify-between text-lg text-blue-600">
                      <span>Vuelto:</span>
                      <span>${change.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {payments.length > 0 && (
              <div>
                <Label>Pagos Agregados:</Label>
                <div className="space-y-2 mt-2">
                  {payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center border p-2 rounded">
                      <span>{getPaymentMethodLabel(payment.method)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${payment.amount.toFixed(2)}</span>
                        <Button size="icon" variant="ghost" onClick={() => removePayment(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {remaining > 0.01 && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <RadioGroup
                    value={currentPayment.method}
                    onValueChange={(v: any) => setCurrentPayment({ ...currentPayment, method: v })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="EFECTIVO" id="efectivo" />
                      <Label htmlFor="efectivo" className="flex items-center gap-2 cursor-pointer">
                        <Banknote className="h-4 w-4" />
                        Efectivo
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TARJETA_DEBITO" id="debito" />
                      <Label htmlFor="debito" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        Tarjeta Débito
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TARJETA_CREDITO" id="credito" />
                      <Label htmlFor="credito" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        Tarjeta Crédito
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TRANSFERENCIA" id="transferencia" />
                      <Label htmlFor="transferencia" className="flex items-center gap-2 cursor-pointer">
                        <DollarSign className="h-4 w-4" />
                        Transferencia
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={currentPayment.amount || ""}
                      onChange={(e) =>
                        setCurrentPayment({ ...currentPayment, amount: parseFloat(e.target.value) || 0 })
                      }
                      min="0"
                      step="0.01"
                    />
                    <Button
                      onClick={() => setCurrentPayment({ ...currentPayment, amount: remaining })}
                      variant="outline"
                    >
                      Completar
                    </Button>
                  </div>
                </div>

                <Button className="w-full" onClick={addPayment} disabled={currentPayment.amount <= 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Pago
                </Button>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={completeSale}
              disabled={remaining > 0.01 || isProcessing}
            >
              {isProcessing ? "Procesando..." : "Finalizar Venta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
