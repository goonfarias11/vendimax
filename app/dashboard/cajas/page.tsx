'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Search, User, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface CashRegister {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  openedAt: string
  closedAt: string | null
  status: 'OPEN' | 'CLOSED'
  openingAmount: number
  closingAmount: number | null
  expectedAmount: number | null
  difference: number | null
  totalCash: number
  totalCard: number
  totalTransfer: number
  totalOther: number
  salesCount: number
  notes: string | null
  stats: {
    salesCount: number
    activeSalesCount: number
    canceledSalesCount: number
    totalSalesAmount: number
    averageTicket: number
    hoursWorked: number
  }
}

export default function CajasAdminPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([])
  const [filteredRegisters, setFilteredRegisters] = useState<CashRegister[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  
  // Filtros
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [search, setSearch] = useState('')

  // Verificar permisos
  const canView = hasPermission(session?.user?.role as any, 'cash:view_history')

  useEffect(() => {
    if (!canView) {
      router.push('/403')
    } else {
      loadData()
    }
  }, [canView])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar usuarios para el filtro
      const usersResponse = await fetch('/api/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }

      // Cargar cajas
      const params = new URLSearchParams()
      if (selectedUser !== 'all') params.append('userId', selectedUser)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/cash/registers?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar cajas')

      const data = await response.json()
      setCashRegisters(data.cashRegisters || [])
      setFilteredRegisters(data.cashRegisters || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las cajas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros
  useEffect(() => {
    let filtered = cashRegisters

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(c => 
        c.user.name.toLowerCase().includes(searchLower) ||
        c.user.email.toLowerCase().includes(searchLower)
      )
    }

    setFilteredRegisters(filtered)
  }, [search, cashRegisters])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDifferenceColor = (difference: number | null) => {
    if (difference === null) return 'bg-gray-100 text-gray-600'
    if (difference > 0) return 'bg-green-100 text-green-700'
    if (difference < 0) return 'bg-red-100 text-red-700'
    return 'bg-blue-100 text-blue-700'
  }

  if (!canView) {
    return null
  }

  // Calcular totales generales
  const totalSalesAmount = filteredRegisters.reduce((acc, c) => acc + c.stats.totalSalesAmount, 0)
  const totalSalesCount = filteredRegisters.reduce((acc, c) => acc + c.stats.activeSalesCount, 0)
  const totalDifference = filteredRegisters
    .filter(c => c.difference !== null)
    .reduce((acc, c) => acc + (c.difference || 0), 0)
  const averageTicket = totalSalesCount > 0 ? totalSalesAmount / totalSalesCount : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestión de Cajas</h1>
        <p className="text-muted-foreground">Control y auditoría de todos los turnos de caja</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cajas Abiertas</p>
              <p className="text-2xl font-bold">
                {filteredRegisters.filter(c => c.status === 'OPEN').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Vendido</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSalesAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ventas Totales</p>
              <p className="text-2xl font-bold">{totalSalesCount}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ticket Promedio</p>
              <p className="text-2xl font-bold">{formatCurrency(averageTicket)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vendedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Vendedor</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value)
                loadData()
              }}
            >
              <option value="all">Todos</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Estado</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                loadData()
              }}
            >
              <option value="all">Todos</option>
              <option value="OPEN">Abiertas</option>
              <option value="CLOSED">Cerradas</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Desde</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                loadData()
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Hasta</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                loadData()
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setSearch('')
              setSelectedUser('all')
              setSelectedStatus('all')
              setStartDate('')
              setEndDate('')
              loadData()
            }}
          >
            Limpiar Filtros
          </Button>
        </div>
      </Card>

      {/* Lista de cajas */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredRegisters.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No hay cajas registradas</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRegisters.map(cash => (
            <Card key={cash.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{cash.user.name}</h3>
                    <p className="text-sm text-muted-foreground">{cash.user.email}</p>
                  </div>
                </div>
                <Badge className={cash.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-500'}>
                  {cash.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Apertura</p>
                  <p className="font-medium">{formatDate(cash.openedAt)}</p>
                </div>
                {cash.closedAt && (
                  <div>
                    <p className="text-muted-foreground">Cierre</p>
                    <p className="font-medium">{formatDate(cash.closedAt)}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Horas Trabajadas</p>
                  <p className="font-medium">{cash.stats.hoursWorked}h</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ventas</p>
                  <p className="font-medium">{cash.stats.activeSalesCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Vendido</p>
                  <p className="font-medium text-green-600">{formatCurrency(cash.stats.totalSalesAmount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Efectivo</p>
                  <p className="font-semibold">{formatCurrency(cash.totalCash)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tarjeta</p>
                  <p className="font-semibold">{formatCurrency(cash.totalCard)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Transferencia</p>
                  <p className="font-semibold">{formatCurrency(cash.totalTransfer)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ticket Promedio</p>
                  <p className="font-semibold">{formatCurrency(cash.stats.averageTicket)}</p>
                </div>
              </div>

              {cash.status === 'CLOSED' && cash.difference !== null && (
                <div className="mt-4 p-4 rounded-lg" style={{
                  backgroundColor: cash.difference > 0 ? '#dcfce7' : cash.difference < 0 ? '#fee2e2' : '#dbeafe'
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Diferencia de Caja</p>
                      <p className="text-xs text-muted-foreground">
                        Esperado: {formatCurrency(cash.expectedAmount || 0)} | 
                        Contado: {formatCurrency(cash.closingAmount || 0)}
                      </p>
                    </div>
                    <p className={`text-2xl font-bold ${
                      cash.difference > 0 ? 'text-green-700' : 
                      cash.difference < 0 ? 'text-red-700' : 
                      'text-blue-700'
                    }`}>
                      {cash.difference >= 0 ? '+' : ''}{formatCurrency(cash.difference)}
                    </p>
                  </div>
                </div>
              )}

              {cash.notes && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Observaciones:</span> {cash.notes}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
