'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Eye, Clock, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface Payment {
  id: string
  amount: number
  type: string
  status: string
  method: string
  transferProof: string | null
  transferReference: string | null
  adminNotes: string | null
  createdAt: string
  paidAt: string | null
  business: {
    id: string
    name: string
    email: string
  }
  subscription: {
    id: string
    planName: string
    billingCycle: string
  }
}

export default function PagosAdminPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    try {
      const response = await fetch('/api/admin/pagos?status=pending')
      if (!response.ok) throw new Error('Error al cargar pagos')
      const data = await response.json()
      setPayments(data.payments)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar pagos')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(paymentId: string) {
    if (!reason.trim()) {
      toast.error('Ingresá un motivo de aprobación')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/pagos/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', reason })
      })

      if (!response.ok) throw new Error('Error al aprobar pago')

      toast.success('Pago aprobado exitosamente')
      setSelectedPayment(null)
      setReason('')
      loadPayments()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al aprobar pago')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject(paymentId: string) {
    if (!reason.trim()) {
      toast.error('Ingresá un motivo de rechazo')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/pagos/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', reason })
      })

      if (!response.ok) throw new Error('Error al rechazar pago')

      toast.error('Pago rechazado')
      setSelectedPayment(null)
      setReason('')
      loadPayments()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al rechazar pago')
    } finally {
      setProcessing(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      setup_fee: 'Setup Fee',
      yearly: 'Anual',
      monthly: 'Mensual',
      addon: 'Addon'
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Cargando pagos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pagos por Transferencia</h1>
        <p className="text-muted-foreground">Aprobá o rechazá pagos de clientes</p>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">No hay pagos pendientes</p>
            <p className="text-sm text-muted-foreground">Todos los pagos han sido procesados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      ${payment.amount.toLocaleString('es-AR')}
                    </CardTitle>
                    <CardDescription>
                      {payment.business.name} - {payment.business.email}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendiente
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">{payment.subscription.planName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{getTypeLabel(payment.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ciclo</p>
                    <p className="font-medium capitalize">{payment.subscription.billingCycle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {format(new Date(payment.createdAt), "d 'de' MMM", { locale: es })}
                    </p>
                  </div>
                </div>

                {payment.transferReference && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Referencia de transferencia</p>
                    <p className="font-mono text-sm">{payment.transferReference}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalles del Pago</DialogTitle>
                        <DialogDescription>
                          Revisá el comprobante y aprobá o rechazá el pago
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Negocio</Label>
                            <p className="font-medium">{payment.business.name}</p>
                          </div>
                          <div>
                            <Label>Email</Label>
                            <p className="font-medium">{payment.business.email}</p>
                          </div>
                          <div>
                            <Label>Plan</Label>
                            <p className="font-medium">{payment.subscription.planName}</p>
                          </div>
                          <div>
                            <Label>Monto</Label>
                            <p className="text-2xl font-bold text-green-600">
                              ${payment.amount.toLocaleString('es-AR')}
                            </p>
                          </div>
                        </div>

                        {payment.transferProof && (
                          <div>
                            <Label>Comprobante de Transferencia</Label>
                            <div className="mt-2 border rounded-lg p-4">
                              <img
                                src={payment.transferProof}
                                alt="Comprobante"
                                className="max-w-full h-auto rounded"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <Label htmlFor="reason">Motivo / Notas</Label>
                          <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ingresá el motivo de aprobación o rechazo..."
                            rows={3}
                          />
                        </div>
                      </div>

                      <DialogFooter className="gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(payment.id)}
                          disabled={processing}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                        <Button
                          onClick={() => handleApprove(payment.id)}
                          disabled={processing}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprobar Pago
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
