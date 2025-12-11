'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface Payment {
  id: string
  amount: number
  type: string
  status: string
  method: string
  paidAt: string | null
  createdAt: string
  invoiceNumber: string | null
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    try {
      const response = await fetch('/api/subscriptions-ars/payments')
      if (!response.ok) throw new Error('Error al cargar pagos')
      const data = await response.json()
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar historial de pagos')
    } finally {
      setLoading(false)
    }
  }

  async function downloadInvoice(paymentId: string) {
    try {
      const response = await fetch(`/api/payments/${paymentId}/invoice`)
      
      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Error al descargar factura')
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${paymentId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Factura descargada')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al descargar factura')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pagado
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      setup_fee: 'Setup Fee',
      monthly: 'Mensual',
      yearly: 'Anual',
      addon: 'Addon'
    }
    return types[type] || type
  }

  const getMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      mercadopago: 'MercadoPago',
      transfer: 'Transferencia'
    }
    return methods[method] || method
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cargando historial...</p>
        </CardContent>
      </Card>
    )
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Pagos
          </CardTitle>
          <CardDescription>Últimos 12 pagos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No hay pagos registrados
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Historial de Pagos
        </CardTitle>
        <CardDescription>Últimos 12 pagos realizados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium">{getTypeLabel(payment.type)}</p>
                  {getStatusBadge(payment.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getMethodLabel(payment.method)} • {' '}
                  {payment.paidAt
                    ? format(new Date(payment.paidAt), "d 'de' MMM, yyyy", { locale: es })
                    : format(new Date(payment.createdAt), "d 'de' MMM, yyyy", { locale: es })}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <p className="text-lg font-bold">
                  ${payment.amount.toLocaleString('es-AR')}
                </p>
                
                {payment.status === 'approved' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadInvoice(payment.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Factura
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
