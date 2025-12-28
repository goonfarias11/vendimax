"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { usePermission } from "@/components/auth/PermissionGuard";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Ban,
  CreditCard,
  Activity,
  FileText
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  status: 'ACTIVE' | 'DELINQUENT' | 'INACTIVE' | 'BLOCKED';
  tags: string[];
  notes: string | null;
  creditLimit: number;
  currentDebt: number;
  hasCreditAccount: boolean;
  totalPurchased: number;
  purchaseCount: number;
  averageTicket: number;
  lastPurchase: string | null;
  createdAt: string;
}

interface Sale {
  id: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  } | null;
}

const statusConfig = {
  ACTIVE: {
    label: 'Activo',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-200'
  },
  DELINQUENT: {
    label: 'Moroso',
    icon: AlertCircle,
    className: 'bg-red-100 text-red-700 border-red-200'
  },
  INACTIVE: {
    label: 'Inactivo',
    icon: XCircle,
    className: 'bg-gray-100 text-gray-700 border-gray-200'
  },
  BLOCKED: {
    label: 'Bloqueado',
    icon: Ban,
    className: 'bg-orange-100 text-orange-700 border-orange-200'
  }
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  // Permisos
  const canEdit = usePermission('clients:edit');
  const canManageCredit = usePermission('clients:edit_credit_limit');
  const canRegisterPayment = usePermission('clients:register_payment');
  const canViewActivity = usePermission('clients:view_activity_log');

  const [client, setClient] = useState<Client | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  // Estados de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    notes: '',
    tags: [] as string[]
  });

  // Estado para nuevo pago
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'EFECTIVO',
    reference: '',
    notes: ''
  });
  const [savingPayment, setSavingPayment] = useState(false);

  // Cargar datos del cliente
  const fetchClientData = async () => {
    try {
      setLoading(true);
      const [clientRes, paymentsRes, activityRes] = await Promise.all([
        fetch(`/api/clients/${clientId}`),
        fetch(`/api/clients/${clientId}/payments`),
        fetch(`/api/clients/${clientId}/activity`)
      ]);

      if (!clientRes.ok) throw new Error('Cliente no encontrado');

      const clientData = await clientRes.json();
      setClient(clientData);
      setSales(clientData.sales || []);
      setPayments(paymentsRes.ok ? await paymentsRes.json() : []);
      setActivityLogs(activityRes.ok ? await activityRes.json() : []);

      // Inicializar formulario de edición
      setEditForm({
        name: clientData.name,
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        taxId: clientData.taxId || '',
        notes: clientData.notes || '',
        tags: clientData.tags || []
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar cliente');
      router.push('/dashboard/clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) throw new Error('Error al actualizar');

      const updated = await response.json();
      setClient(updated);
      setIsEditing(false);
      alert('Cliente actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar cliente');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayment(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference || null,
          notes: paymentForm.notes || null
        })
      });

      if (!response.ok) throw new Error('Error al registrar pago');

      const { payment, client: updatedClient } = await response.json();
      setClient(updatedClient);
      setPayments([payment, ...payments]);
      setPaymentForm({ amount: '', paymentMethod: 'EFECTIVO', reference: '', notes: '' });
      setShowPaymentForm(false);
      alert('Pago registrado correctamente');
      fetchClientData(); // Recargar para actualizar activity log
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar pago');
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const StatusIcon = statusConfig[client.status].icon;
  const debtPercentage = client.creditLimit > 0 
    ? (Number(client.currentDebt) / Number(client.creditLimit)) * 100 
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/clientes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">Cliente desde {new Date(client.createdAt).toLocaleDateString()}</p>
          </div>
          <Badge className={statusConfig[client.status].className}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig[client.status].label}
          </Badge>
        </div>
        {canEdit && !isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        ) : canEdit ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </div>
        ) : null}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Comprado</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Number(client.totalPurchased).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Number(client.averageTicket).toLocaleString()}
              </p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Compras</p>
              <p className="text-2xl font-bold text-gray-900">{client.purchaseCount}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Última Compra</p>
              <p className="text-xl font-bold text-gray-900">
                {client.lastPurchase 
                  ? new Date(client.lastPurchase).toLocaleDateString()
                  : 'Nunca'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex gap-4 px-6">
            <button
              className={`py-4 border-b-2 font-medium ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Resumen
            </button>
            <button
              className={`py-4 border-b-2 font-medium ${
                activeTab === 'sales'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('sales')}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Historial de Compras
            </button>
            <button
              className={`py-4 border-b-2 font-medium ${
                activeTab === 'credit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('credit')}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Cuenta Corriente
            </button>
            <button
              className={`py-4 border-b-2 font-medium ${
                activeTab === 'payments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('payments')}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Pagos ({payments.length})
            </button>
            <button
              className={`py-4 border-b-2 font-medium ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('activity')}              style={{ display: canViewActivity ? 'block' : 'none' }}            >
              <Activity className="w-4 h-4 inline mr-2" />
              Auditoría
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tab: Resumen */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Nombre</label>
                      {isEditing ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <p className="font-medium">{client.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      ) : (
                        <p className="font-medium">{client.email || 'Sin email'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Teléfono</label>
                      {isEditing ? (
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      ) : (
                        <p className="font-medium">{client.phone || 'Sin teléfono'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Dirección</label>
                      {isEditing ? (
                        <Input
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        />
                      ) : (
                        <p className="font-medium">{client.address || 'Sin dirección'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">DNI/CUIT</label>
                      {isEditing ? (
                        <Input
                          value={editForm.taxId}
                          onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                        />
                      ) : (
                        <p className="font-medium">{client.taxId || 'Sin documento'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Información Adicional</h3>
                  <div className="space-y-3">
                    {/* Toggle Cuenta Corriente */}
                    <div className="border-b pb-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Cuenta Corriente</label>
                          <p className="text-xs text-gray-500">Habilitar compras a crédito</p>
                        </div>
                        <button
                          onClick={async () => {
                            const newValue = !client.hasCreditAccount;
                            try {
                              const response = await fetch(`/api/clients/${clientId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ hasCreditAccount: newValue })
                              });
                              if (response.ok) {
                                setClient({ ...client, hasCreditAccount: newValue });
                              }
                            } catch (error) {
                              console.error('Error:', error);
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            client.hasCreditAccount ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              client.hasCreditAccount ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {client.hasCreditAccount && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-gray-700">Límite de crédito:</span>
                            <span className="font-medium">${Number(client.creditLimit).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">Deuda actual:</span>
                            <span className="font-medium text-red-600">${Number(client.currentDebt).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Etiquetas</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {client.tags.length > 0 ? (
                          client.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary">{tag}</Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">Sin etiquetas</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Notas Internas</label>
                      {isEditing ? (
                        <Textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={5}
                        />
                      ) : (
                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                          {client.notes || 'Sin notas'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Historial de Compras */}
          {activeTab === 'sales' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Historial de Compras</h3>
              {sales.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay compras registradas</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Método de Pago
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {new Date(sale.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            ${Number(sale.total).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {sale.paymentMethod}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Cuenta Corriente */}
          {activeTab === 'credit' && (
            <div className="space-y-6">
              {!client.hasCreditAccount ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cuenta Corriente Deshabilitada</h3>
                  <p className="text-gray-600 mb-4">
                    Este cliente no tiene cuenta corriente habilitada.
                  </p>
                  <p className="text-sm text-gray-500">
                    Actívala desde el tab "Resumen" para permitir compras a crédito.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Deuda Actual</p>
                        <p className="text-3xl font-bold text-gray-900">
                          ${Number(client.currentDebt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Límite de Crédito</p>
                        <p className="text-2xl font-bold text-gray-700">
                          ${Number(client.creditLimit).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          debtPercentage >= 100 ? 'bg-red-500' :
                          debtPercentage >= 80 ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(debtPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {debtPercentage.toFixed(1)}% del límite utilizado
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Registrar Pago</h3>
                      {canRegisterPayment && !showPaymentForm && (
                        <Button onClick={() => setShowPaymentForm(true)} className="bg-blue-600 hover:bg-blue-700">
                          Nuevo Pago
                        </Button>
                      )}
                    </div>

                {canRegisterPayment && showPaymentForm && (
                  <form onSubmit={handlePaymentSubmit} className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto *
                        </label>
                        <Input
                          type="number"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Método de Pago *
                        </label>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          value={paymentForm.paymentMethod}
                          onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                        >
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="TARJETA">Tarjeta</option>
                          <option value="TRANSFERENCIA">Transferencia</option>
                          <option value="CHEQUE">Cheque</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Referencia/Comprobante
                      </label>
                      <Input
                        value={paymentForm.reference}
                        onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                        placeholder="Número de comprobante (opcional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas
                      </label>
                      <Textarea
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        placeholder="Notas adicionales (opcional)"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPaymentForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={savingPayment}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {savingPayment ? 'Guardando...' : 'Registrar Pago'}
                      </Button>
                    </div>
                  </form>
                )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Pagos */}
          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Historial de Pagos</h3>
              {payments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay pagos registrados</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Monto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Método
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Referencia
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Registrado por
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {new Date(payment.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-green-600">
                            ${Number(payment.amount).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {payment.paymentMethod}
                          </td>
                          <td className="px-4 py-3">
                            {payment.reference || '-'}
                          </td>
                          <td className="px-4 py-3">
                            {payment.user.name || payment.user.email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Auditoría */}
          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Registro de Actividad</h3>
              {activityLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay actividad registrada</p>
              ) : (
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{log.description}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Acción: <span className="font-medium">{log.action}</span>
                          </p>
                          {log.user && (
                            <p className="text-sm text-gray-600">
                              Por: {log.user.name || log.user.email}
                            </p>
                          )}
                          {log.ipAddress && (
                            <p className="text-sm text-gray-500">
                              IP: {log.ipAddress}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-sm text-blue-600 cursor-pointer">
                            Ver detalles
                          </summary>
                          <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
