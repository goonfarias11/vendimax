'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { DollarSign, Clock, ShoppingCart, TrendingUp, Lock, Unlock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface CurrentCash {
  id: string
  user: {
    id: string
    name: string
  }
  openedAt: string
  status: 'OPEN' | 'CLOSED'
  openingAmount: number
  notes: string | null
  stats: {
    salesCount: number
    totalSales: number
    totalCash: number
    totalCard: number
    totalTransfer: number
    expectedAmount: number
    averageTicket: number
    hoursOpen: number
    salesByPaymentMethod: Record<string, { count: number, total: number }>
  }
  recentSales: Array<{
    id: string
    total: number
    paymentMethod: string
    createdAt: string
  }>
}

export default function MiCajaPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  
  const [currentCash, setCurrentCash] = useState<CurrentCash | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Modal de apertura
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState('')
  const [openingNotes, setOpeningNotes] = useState('')
  
  // Modal de cierre
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closingAmount, setClosingAmount] = useState('')
  const [closingNotes, setClosingNotes] = useState('')

  // Verificar permisos
  const canView = hasPermission(session?.user?.role as any, 'cash:view')
  const canOpen = hasPermission(session?.user?.role as any, 'cash:register_movement')
  const canClose = hasPermission(session?.user?.role as any, 'cash:close_day')

  useEffect(() => {
    if (!canView) {
      router.push('/403')
    } else {
      loadCurrentCash()
      // Refrescar cada 30 segundos si hay caja abierta
      const interval = setInterval(() => {
        if (currentCash?.status === 'OPEN') {
          loadCurrentCash()
        }
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [canView])

  const loadCurrentCash = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cash/current')
      if (!response.ok) throw new Error('Error al cargar caja')

      const data = await response.json()
      setCurrentCash(data.currentCash)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el estado de la caja',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCash = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      toast({
        title: 'Error',
        description: 'Ingresa un monto inicial válido',
        variant: 'destructive'
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch('/api/cash/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openingAmount: parseFloat(openingAmount),
          notes: openingNotes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al abrir caja')
      }

      toast({
        title: 'Caja Abierta',
        description: 'Tu turno de caja ha comenzado',
        variant: 'default'
      })

      setShowOpenModal(false)
      setOpeningAmount('')
      setOpeningNotes('')
      loadCurrentCash()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseCash = async () => {
    if (!closingAmount || parseFloat(closingAmount) < 0) {
      toast({
        title: 'Error',
        description: 'Ingresa el monto final contado',
        variant: 'destructive'
      })
      return
    }

    // Validar observaciones si hay diferencia significativa
    const difference = parseFloat(closingAmount) - currentCash!.stats.expectedAmount
    if (Math.abs(difference) >= 10 && (!closingNotes || closingNotes.trim().length === 0)) {
      toast({
        title: 'Observaciones Requeridas',
        description: 'Debes explicar la diferencia de efectivo cuando es mayor o igual a $10',
        variant: 'destructive'
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch('/api/cash/register/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashRegisterId: currentCash?.id,
          closingAmount: parseFloat(closingAmount),
          notes: closingNotes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al cerrar caja')
      }

      const data = await response.json()

      // Mostrar mensaje de éxito con información detallada
      const differenceText = data.summary.cashDifference >= 0 ? '+' : ''
      const requiresAuth = data.summary.requiresAuthorization

      toast({
        title: data.summary.cashDifference === 0 ? '✅ Caja Cerrada Correctamente' : requiresAuth ? '⚠️ Caja Cerrada - Requiere Autorización' : '✅ Caja Cerrada',
        description: `
          ${data.summary.salesCount} ventas · ${formatCurrency(data.summary.totalSales)}
          Diferencia: ${differenceText}${formatCurrency(data.summary.cashDifference)}
          ${requiresAuth ? '\nSe requiere autorización de supervisor' : ''}
        `,
        variant: data.summary.cashDifference === 0 ? 'default' : requiresAuth ? 'destructive' : 'default',
        duration: 8000
      })

      setShowCloseModal(false)
      setClosingAmount('')
      setClosingNotes('')
      loadCurrentCash()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!canView) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Sin caja abierta
  if (!currentCash) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mi Caja</h1>
          <p className="text-muted-foreground">Gestiona tu turno de caja</p>
        </div>

        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Unlock className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No tienes una caja abierta</h3>
              <p className="text-muted-foreground mb-6">
                Para comenzar a vender, primero debes abrir tu caja
              </p>
            </div>
            {canOpen && (
              <Button size="lg" onClick={() => setShowOpenModal(true)}>
                <Unlock className="mr-2 h-5 w-5" />
                Abrir Caja
              </Button>
            )}
          </div>
        </Card>

        {/* Modal de apertura */}
        {showOpenModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6 m-4">
              <h2 className="text-2xl font-bold mb-4">Abrir Caja</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Monto Inicial <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingresa el efectivo con el que comienzas tu turno
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Observaciones
                  </label>
                  <Textarea
                    placeholder="Notas opcionales..."
                    value={openingNotes}
                    onChange={(e) => setOpeningNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowOpenModal(false)
                      setOpeningAmount('')
                      setOpeningNotes('')
                    }}
                    disabled={actionLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleOpenCash}
                    disabled={actionLoading || !openingAmount}
                  >
                    {actionLoading ? 'Abriendo...' : 'Abrir Caja'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Con caja abierta
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mi Caja</h1>
          <p className="text-muted-foreground">Turno iniciado a las {formatTime(currentCash.openedAt)}</p>
        </div>
        <Badge className="bg-green-500 text-lg px-4 py-2">
          <Clock className="mr-2 h-4 w-4" />
          Abierta - {currentCash.stats.hoursOpen}h
        </Badge>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ventas</p>
              <p className="text-3xl font-bold">{currentCash.stats.salesCount}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Vendido</p>
              <p className="text-2xl font-bold">{formatCurrency(currentCash.stats.totalSales)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ticket Promedio</p>
              <p className="text-2xl font-bold">{formatCurrency(currentCash.stats.averageTicket)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Efectivo Esperado</p>
              <p className="text-2xl font-bold">{formatCurrency(currentCash.stats.expectedAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Desglose por método de pago */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Desglose por Método de Pago</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Efectivo</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(currentCash.stats.totalCash)}</p>
            <p className="text-xs text-muted-foreground">
              {currentCash.stats.salesByPaymentMethod['EFECTIVO']?.count || 0} ventas
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Tarjeta</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(currentCash.stats.totalCard)}</p>
            <p className="text-xs text-muted-foreground">
              {(currentCash.stats.salesByPaymentMethod['TARJETA_DEBITO']?.count || 0) + 
               (currentCash.stats.salesByPaymentMethod['TARJETA_CREDITO']?.count || 0)} ventas
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Transferencia</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(currentCash.stats.totalTransfer)}</p>
            <p className="text-xs text-muted-foreground">
              {(currentCash.stats.salesByPaymentMethod['TRANSFERENCIA']?.count || 0) + 
               (currentCash.stats.salesByPaymentMethod['QR']?.count || 0)} ventas
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Apertura</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(currentCash.openingAmount)}</p>
            <p className="text-xs text-muted-foreground">Monto inicial</p>
          </div>
        </div>
      </Card>

      {/* Últimas ventas */}
      {currentCash.recentSales.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Últimas Ventas</h3>
          <div className="space-y-2">
            {currentCash.recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatTime(sale.createdAt)}
                  </span>
                  <Badge variant="outline">{sale.paymentMethod.replace('_', ' ')}</Badge>
                </div>
                <span className="font-semibold">{formatCurrency(sale.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Botón de cierre */}
      {canClose && (
        <div className="flex justify-end">
          <Button
            size="lg"
            variant="destructive"
            onClick={() => setShowCloseModal(true)}
          >
            <Lock className="mr-2 h-5 w-5" />
            Cerrar Caja
          </Button>
        </div>
      )}

      {/* Modal de cierre */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Cierre de Caja - Resumen del Turno</h2>
            
            <div className="space-y-6">
              {/* Resumen general */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-900">📊 Resumen de Operaciones</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-700">Total de Ventas:</p>
                    <p className="font-bold text-blue-900">{currentCash.stats.salesCount} operaciones</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Total Vendido:</p>
                    <p className="font-bold text-blue-900">{formatCurrency(currentCash.stats.totalSales)}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Ticket Promedio:</p>
                    <p className="font-bold text-blue-900">{formatCurrency(currentCash.stats.averageTicket)}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Horas Trabajadas:</p>
                    <p className="font-bold text-blue-900">{currentCash.stats.hoursOpen}h</p>
                  </div>
                </div>
              </div>

              {/* Desglose por método de pago */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-3">💰 Desglose por Método de Pago</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm">💵 Efectivo</span>
                    <span className="font-semibold">{formatCurrency(currentCash.stats.totalCash)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm">💳 Tarjetas</span>
                    <span className="font-semibold">{formatCurrency(currentCash.stats.totalCard)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-sm">🏦 Transferencias</span>
                    <span className="font-semibold">{formatCurrency(currentCash.stats.totalTransfer)}</span>
                  </div>
                </div>
              </div>

              {/* Control de efectivo */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold mb-3 text-yellow-900">🔍 Control de Efectivo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Apertura:</span>
                    <span className="font-semibold">{formatCurrency(currentCash.openingAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">+ Ventas en Efectivo:</span>
                    <span className="font-semibold">{formatCurrency(currentCash.stats.totalCash)}</span>
                  </div>
                  <div className="border-t border-yellow-300 my-2 pt-2 flex justify-between">
                    <span className="text-yellow-900 font-semibold">= Efectivo Esperado:</span>
                    <span className="font-bold text-lg">{formatCurrency(currentCash.stats.expectedAmount)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  💵 Efectivo Real Contado <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  autoFocus
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ⚠️ Cuenta cuidadosamente todo el efectivo en caja
                </p>
              </div>

              {closingAmount && (
                <div className={`p-4 rounded-lg border-2 ${
                  parseFloat(closingAmount) - currentCash.stats.expectedAmount > 0 ? 'bg-green-50 border-green-300' :
                  parseFloat(closingAmount) - currentCash.stats.expectedAmount < 0 ? 'bg-red-50 border-red-300' :
                  'bg-blue-50 border-blue-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Diferencia de Efectivo</p>
                      <p className="text-2xl font-bold">
                        {parseFloat(closingAmount) - currentCash.stats.expectedAmount >= 0 ? '+' : ''}
                        {formatCurrency(parseFloat(closingAmount) - currentCash.stats.expectedAmount)}
                      </p>
                    </div>
                    <div className="text-4xl">
                      {parseFloat(closingAmount) - currentCash.stats.expectedAmount === 0 ? '✅' :
                       parseFloat(closingAmount) - currentCash.stats.expectedAmount > 0 ? '📈' : '📉'}
                    </div>
                  </div>
                  {Math.abs(parseFloat(closingAmount) - currentCash.stats.expectedAmount) >= 10 && (
                    <p className="text-xs mt-2 font-semibold text-orange-600">
                      ⚠️ Diferencia significativa - Las observaciones son obligatorias
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">
                  📝 Observaciones {closingAmount && Math.abs(parseFloat(closingAmount) - currentCash.stats.expectedAmount) >= 10 && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <Textarea
                  placeholder={closingAmount && Math.abs(parseFloat(closingAmount) - currentCash.stats.expectedAmount) >= 10 
                    ? "Explica la diferencia de efectivo (OBLIGATORIO)..." 
                    : "Notas sobre el cierre..."}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  rows={3}
                  className={closingAmount && Math.abs(parseFloat(closingAmount) - currentCash.stats.expectedAmount) >= 10 && !closingNotes 
                    ? 'border-red-300' 
                    : ''}
                />
                {closingAmount && Math.abs(parseFloat(closingAmount) - currentCash.stats.expectedAmount) >= 10 && !closingNotes && (
                  <p className="text-xs text-red-600 mt-1">
                    Debes explicar por qué hay una diferencia mayor a $10
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCloseModal(false)
                    setClosingAmount('')
                    setClosingNotes('')
                  }}
                  disabled={actionLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCloseCash}
                  disabled={actionLoading || !closingAmount}
                >
                  {actionLoading ? 'Cerrando...' : 'Cerrar Caja'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
