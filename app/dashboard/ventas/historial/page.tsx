"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePermission, useRole } from "@/components/auth/PermissionGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ShoppingBag, 
  Search, 
  Eye, 
  Ban, 
  Download,
  Calendar,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface Sale {
  id: string
  ticketNumber: string
  createdAt: string
  client: { id: string; name: string } | null
  user: { id: string; name: string; email: string }
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  status: string
  itemsCount: number
}

interface SaleDetail {
  id: string
  ticketNumber: string
  createdAt: string
  client: { id: string; name: string; email: string | null; phone: string | null } | null
  user: { id: string; name: string; email: string }
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  status: string
  saleItems: Array<{
    id: string
    quantity: number
    price: number
    subtotal: number
    product: {
      id: string
      name: string
      sku: string
      price: number
      cost: number
    }
  }>
  cashMovement: any
}

const paymentMethodLabels: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA_DEBITO: 'Tarjeta Débito',
  TARJETA_CREDITO: 'Tarjeta Crédito',
  TRANSFERENCIA: 'Transferencia',
  QR: 'QR',
  CUENTA_CORRIENTE: 'Cuenta Corriente',
  OTRO: 'Otro'
}

const statusColors: Record<string, string> = {
  COMPLETADO: 'bg-green-100 text-green-800',
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  ANULADO: 'bg-red-100 text-red-800'
}

const statusIcons: Record<string, any> = {
  COMPLETADO: CheckCircle,
  PENDIENTE: AlertCircle,
  ANULADO: XCircle
}

// Helper para renderizar números de forma segura
const safeNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatCurrency = (value: any): string => {
  return safeNumber(value).toLocaleString();
};

export default function SalesHistoryPage() {
  const router = useRouter()
  const canView = usePermission('pos:access')
  const canCancel = usePermission('pos:cancel_sale')
  const currentRole = useRole()

  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [canceling, setCanceling] = useState(false)

  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (!canView) {
      router.push('/dashboard/403')
      return
    }
    fetchSales()
    fetchUsers()
  }, [canView, startDate, endDate, userFilter, paymentFilter, statusFilter])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (userFilter !== 'all') params.append('userId', userFilter)
      if (paymentFilter !== 'all') params.append('paymentMethod', paymentFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/sales?${params}`)
      if (!response.ok) throw new Error('Error al cargar ventas')
      
      const data = await response.json()
      setSales(data.sales || [])
    } catch (error) {
      toast.error('Error al cargar ventas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const viewSaleDetail = async (saleId: string) => {
    try {
      setLoadingDetail(true)
      const response = await fetch(`/api/sales/${saleId}`)
      if (!response.ok) throw new Error('Error al cargar detalle')
      
      const data = await response.json()
      setSelectedSale(data)
    } catch (error) {
      toast.error('Error al cargar detalle de venta')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCancelSale = async () => {
    if (!selectedSale || !cancelReason.trim() || cancelReason.length < 10) {
      toast.error('Debes proporcionar un motivo de al menos 10 caracteres')
      return
    }

    try {
      setCanceling(true)
      const response = await fetch(`/api/sales/${selectedSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al anular venta')
      }

      toast.success('Venta anulada correctamente')
      setShowCancelModal(false)
      setSelectedSale(null)
      setCancelReason('')
      fetchSales()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setCanceling(false)
    }
  }

  const filteredSales = sales.filter(sale =>
    sale.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <ShieldAlert className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para ver el historial de ventas</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial de Ventas</h1>
          <p className="text-gray-600">Consulta y gestiona las ventas realizadas</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar venta, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Fecha inicio"
              />
            </div>
            <div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Fecha fin"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="COMPLETADO">Completado</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="ANULADO">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentRole !== 'VENDEDOR' && (
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los vendedores</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TARJETA_DEBITO">Tarjeta Débito</SelectItem>
                <SelectItem value="TARJETA_CREDITO">Tarjeta Crédito</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                <SelectItem value="QR">QR</SelectItem>
                <SelectItem value="CUENTA_CORRIENTE">Cuenta Corriente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Ventas</div>
          <div className="text-2xl font-bold">{filteredSales.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Monto Total</div>
          <div className="text-2xl font-bold">
            ${formatCurrency(filteredSales.reduce((sum, sale) => sum + safeNumber(sale.total), 0))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Completadas</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredSales.filter(s => s.status === 'COMPLETADO').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Anuladas</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredSales.filter(s => s.status === 'ANULADO').length}
          </div>
        </Card>
      </div>

      {/* Tabla de ventas */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  N° Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.map((sale) => {
                const StatusIcon = statusIcons[sale.status] || AlertCircle
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      #{sale.ticketNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sale.createdAt).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {sale.client?.name || <span className="text-gray-400">Sin cliente</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.user.name}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      ${formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[sale.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewSaleDetail(sale.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay ventas
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || startDate || endDate ? 'No se encontraron ventas con esos filtros' : 'No hay ventas registradas'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal Detalle de Venta */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : selectedSale && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle de Venta #{selectedSale.ticketNumber}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Info general */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Fecha</div>
                    <div className="font-medium">
                      {new Date(selectedSale.createdAt).toLocaleString('es-AR')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Estado</div>
                    <Badge className={statusColors[selectedSale.status]}>
                      {selectedSale.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Vendedor</div>
                    <div className="font-medium">{selectedSale.user.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Cliente</div>
                    <div className="font-medium">
                      {selectedSale.client?.name || 'Sin cliente'}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-semibold mb-3">Productos</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Producto</th>
                          <th className="px-4 py-2 text-right">Cant.</th>
                          <th className="px-4 py-2 text-right">Precio</th>
                          <th className="px-4 py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedSale.saleItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2">
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                            </td>
                            <td className="px-4 py-2 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">${item.price.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right font-medium">
                              ${item.subtotal.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totales */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${selectedSale.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedSale.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Descuento:</span>
                        <span>-${selectedSale.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>${formatCurrency(selectedSale.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Método de pago:</span>
                      <span className="font-medium">
                        {paymentMethodLabels[selectedSale.paymentMethod]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                {canCancel && selectedSale.status === 'COMPLETADO' && (
                  <div className="border-t pt-4">
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelModal(true)}
                      className="w-full"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Anular Venta
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Anular Venta */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Esta acción anulará la venta, devolverá el stock y ajustará la caja.
                No se puede deshacer.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Motivo de anulación (mínimo 10 caracteres) *
              </label>
              <textarea
                className="w-full border rounded-lg p-3 min-h-[100px]"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Describe el motivo de la anulación..."
              />
              <div className="text-sm text-gray-500 mt-1">
                {cancelReason.length}/10 caracteres mínimos
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSale}
              disabled={canceling || cancelReason.length < 10}
            >
              {canceling ? 'Anulando...' : 'Confirmar Anulación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
