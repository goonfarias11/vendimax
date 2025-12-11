"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, Plus, Trash2, ShoppingCart, X } from "lucide-react"
import { useSession } from "next-auth/react"

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category: string
  barcode?: string
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
}

interface CartItem extends Product {
  quantity: number
  subtotal: number
}

export default function NuevaVentaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchProduct, setSearchProduct] = useState("")
  const [searchClient, setSearchClient] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TARJETA_DEBITO" | "TARJETA_CREDITO" | "TRANSFERENCIA" | "QR" | "OTRO">("EFECTIVO")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showProductResults, setShowProductResults] = useState(false)
  const [showClientResults, setShowClientResults] = useState(false)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  })

  // Cargar productos
  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        // Asegurar que price y stock sean números
        const productsWithNumbers = data.map((p: any) => ({
          ...p,
          price: Number(p.price),
          stock: Number(p.stock)
        }))
        setProducts(productsWithNumbers)
      })
      .catch(err => console.error("Error cargando productos:", err))
  }, [])

  // Cargar clientes
  useEffect(() => {
    fetch("/api/clients")
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(err => console.error("Error cargando clientes:", err))
  }, [])

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.barcode?.includes(searchProduct)
  )

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.phone?.includes(searchClient)
  )

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) {
        setError("Stock insuficiente")
        return
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * Number(item.price) }
          : item
      ))
    } else {
      if (product.stock < 1) {
        setError("Producto sin stock")
        return
      }
      setCart([...cart, { 
        ...product,
        price: Number(product.price),
        stock: Number(product.stock),
        quantity: 1, 
        subtotal: Number(product.price) 
      }])
    }
    setSearchProduct("")
    setShowProductResults(false)
    setError("")
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    if (newQuantity > product.stock) {
      setError("Stock insuficiente")
      return
    }

    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * Number(item.price) }
        : item
    ))
    setError("")
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0)

  const handleCreateClient = async () => {
    if (!newClientData.name.trim()) {
      setError("El nombre del cliente es obligatorio")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClientData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al crear el cliente")
      }

      const newClient = await response.json()
      setClients([...clients, newClient])
      setSelectedClient(newClient)
      setShowNewClientForm(false)
      setNewClientData({ name: "", email: "", phone: "", address: "" })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError("Agrega productos al carrito")
      return
    }

    if (!selectedClient) {
      setError("Selecciona un cliente")
      return
    }

    setLoading(true)
    setError("")

    try {
      const payload = {
        clientId: selectedClient.id,
        paymentMethod,
        items: cart.map(item => ({
          productId: item.id,
          quantity: Number(item.quantity),
          price: Number(item.price)
        }))
      }
      
      console.log("Payload a enviar:", payload)
      console.log("Tipos:", {
        clientId: typeof payload.clientId,
        paymentMethod: typeof payload.paymentMethod,
        items: payload.items.map(i => ({
          productId: typeof i.productId,
          quantity: typeof i.quantity,
          price: typeof i.price
        }))
      })

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("Error completo:", data)
        
        // Mostrar error detallado
        let errorMsg = data.error || "Error al crear la venta"
        if (data.field) {
          errorMsg += `\n\nCampo: ${data.field}`
        }
        if (data.details) {
          errorMsg += `\n\nDetalles:\n${data.details.map((d: any) => `- ${d.field}: ${d.message}`).join('\n')}`
        }
        
        alert(errorMsg) // Temporal para debug
        throw new Error(data.error || "Error al crear la venta")
      }

      // Éxito
      router.push("/dashboard/ventas")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
          <p className="text-gray-500 mt-1">Procesa una nueva venta</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/ventas")}
        >
          Cancelar
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo - Productos y cliente */}
        <div className="lg:col-span-2 space-y-6">
          {/* Buscar producto */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar Producto
            </h2>
            <div className="relative">
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => {
                  setSearchProduct(e.target.value)
                  setShowProductResults(true)
                }}
                onFocus={() => setShowProductResults(true)}
                placeholder="Nombre o código de barras..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {showProductResults && searchProduct && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="w-full px-4 py-3 hover:bg-gray-50 text-left border-b last:border-b-0 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            Stock: {product.stock} | ${product.price.toLocaleString()}
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-blue-600" />
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      No se encontraron productos
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Seleccionar cliente */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Seleccionar Cliente
            </h2>
            {selectedClient ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <div>
                  <div className="font-medium text-blue-900">{selectedClient.name}</div>
                  {selectedClient.email && (
                    <div className="text-sm text-blue-700">{selectedClient.email}</div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : showNewClientForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={newClientData.name}
                    onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newClientData.email}
                    onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                    placeholder="juan@ejemplo.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={newClientData.phone}
                    onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                    placeholder="3511234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={newClientData.address}
                    onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                    placeholder="Calle 123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateClient}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? "Creando..." : "Crear Cliente"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewClientForm(false)
                      setNewClientData({ name: "", email: "", phone: "", address: "" })
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchClient}
                    onChange={(e) => {
                      setSearchClient(e.target.value)
                      setShowClientResults(true)
                    }}
                    onFocus={() => setShowClientResults(true)}
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  {showClientResults && searchClient && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                          <button
                            key={client.id}
                            onClick={() => {
                              setSelectedClient(client)
                              setSearchClient("")
                              setShowClientResults(false)
                            }}
                            className="w-full px-4 py-3 hover:bg-gray-50 text-left border-b last:border-b-0"
                          >
                            <div className="font-medium">{client.name}</div>
                            {client.email && (
                              <div className="text-sm text-gray-500">{client.email}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          No se encontraron clientes
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowNewClientForm(true)}
                  className="w-full border-dashed border-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Nuevo Cliente
                </Button>
              </div>
            )}
          </Card>

          {/* Carrito */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrito ({cart.length} items)
            </h2>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                El carrito está vacío. Busca y agrega productos.
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        ${item.price.toLocaleString()} c/u
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border border-gray-300 rounded py-1"
                        min="1"
                        max={item.stock}
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <div className="w-24 text-right font-semibold">
                      ${item.subtotal.toLocaleString()}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Panel derecho - Resumen y pago */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Resumen de Venta</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Items:</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="QR">QR</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={loading || cart.length === 0 || !selectedClient}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {loading ? "Procesando..." : "Procesar Venta"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCart([])
                  setSelectedClient(null)
                  setError("")
                }}
                className="w-full"
              >
                Limpiar Todo
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
