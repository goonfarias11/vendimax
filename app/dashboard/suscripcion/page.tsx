"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatPrice } from '@/lib/mercadopago'
import { PaymentHistory } from '@/components/payment-history'

interface Plan {
  id: string
  name: string
  slug: string
  description: string
  priceMonthly: number
  priceYearly: number
  setupFee: number
  features: string[]
}

interface Addon {
  id: string
  name: string
  slug: string
  description: string
  priceMonthly: number
  features: string[]
}

interface Subscription {
  id: string
  plan: Plan
  status: string
  billingCycle: string
  currentPeriodEnd: string
  setupFeePaid: boolean
  totalMonthly: number
  addons: Addon[]
}

export default function SuscripcionPage() {
  const { data: session } = useSession()
  const [plans, setPlans] = useState<Plan[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch('/api/subscriptions-ars/create')
      const data = await res.json()
      setPlans(data.plans || [])
      setAddons(data.addons || [])
      setLoading(false)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setLoading(false)
    }
  }

  const handleCreateSubscription = async () => {
    if (!selectedPlan) {
      alert('Selecciona un plan')
      return
    }

    try {
      const res = await fetch('/api/subscriptions-ars/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: selectedPlan,
          billingCycle: selectedCycle,
          addonSlugs: selectedAddons
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error al crear suscripción')
        return
      }

      // Si hay link de MercadoPago, redirigir
      if (data.subscription.mercadopagoInitPoint) {
        window.location.href = data.subscription.mercadopagoInitPoint
      } else {
        alert('Suscripción creada. Debes pagar el Setup Fee para activarla.')
        window.location.reload()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear suscripción')
    }
  }

  const toggleAddon = (slug: string) => {
    setSelectedAddons(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    )
  }

  const calculateTotal = () => {
    const plan = plans.find(p => p.slug === selectedPlan)
    if (!plan) return 0

    const planPrice = selectedCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly
    const addonsTotal = addons
      .filter(a => selectedAddons.includes(a.slug))
      .reduce((sum, a) => sum + a.priceMonthly, 0)

    return planPrice + addonsTotal
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mi Suscripción</h1>

      {subscription ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Plan Actual: {subscription.plan.name}</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600">Estado</p>
              <p className="font-semibold capitalize">{subscription.status}</p>
            </div>
            <div>
              <p className="text-gray-600">Ciclo de Facturación</p>
              <p className="font-semibold capitalize">{subscription.billingCycle}</p>
            </div>
            <div>
              <p className="text-gray-600">Próximo Vencimiento</p>
              <p className="font-semibold">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-AR')}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Mensual</p>
              <p className="font-semibold">{formatPrice(subscription.totalMonthly)}</p>
            </div>
          </div>

          {!subscription.setupFeePaid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <p className="font-semibold text-yellow-800">⚠️ Setup Fee Pendiente</p>
              <p className="text-yellow-700 text-sm mt-1">
                Debes pagar el Setup Fee de {formatPrice(subscription.plan.setupFee)} para activar tu suscripción.
              </p>
              <button className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
                Pagar Setup Fee
              </button>
            </div>
          )}

          {subscription.addons.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Addons Activos:</h3>
              <ul className="list-disc list-inside">
                {subscription.addons.map(addon => (
                  <li key={addon.id}>
                    {addon.name} - {formatPrice(addon.priceMonthly)}/mes
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Selecciona un Plan</h2>
            
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setSelectedCycle('monthly')}
                className={`px-4 py-2 rounded ${
                  selectedCycle === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setSelectedCycle('yearly')}
                className={`px-4 py-2 rounded ${
                  selectedCycle === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200'
                }`}
              >
                Anual (20% OFF)
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.slug)}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition ${
                    selectedPlan === plan.slug
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      {formatPrice(
                        selectedCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly
                      )}
                    </span>
                    <span className="text-gray-600">/{selectedCycle === 'yearly' ? 'año' : 'mes'}</span>
                  </div>
                  <ul className="text-sm space-y-2">
                    {(typeof plan.features === 'string' 
                      ? JSON.parse(plan.features)
                      : plan.features
                    ).map((feature: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Addons Opcionales</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {addons.map(addon => (
                <div
                  key={addon.id}
                  onClick={() => toggleAddon(addon.slug)}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition ${
                    selectedAddons.includes(addon.slug)
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="text-lg font-bold mb-2">{addon.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{addon.description}</p>
                  <div className="mb-4">
                    <span className="text-2xl font-bold">
                      +{formatPrice(addon.priceMonthly)}
                    </span>
                    <span className="text-gray-600">/mes</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {(typeof addon.features === 'string'
                      ? JSON.parse(addon.features)
                      : addon.features
                    ).map((feature: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Total</h3>
              <span className="text-3xl font-bold text-blue-600">
                {formatPrice(calculateTotal())}
                <span className="text-lg text-gray-600">
                  /{selectedCycle === 'yearly' ? 'año' : 'mes'}
                </span>
              </span>
            </div>
            
            {selectedPlan && (
              <div className="mb-4 text-sm text-gray-600">
                <p>+ Setup Fee único: {formatPrice(plans.find(p => p.slug === selectedPlan)?.setupFee || 60000)}</p>
                {selectedCycle === 'yearly' && (
                  <p className="text-green-600 font-semibold">
                    ¡Ahorrás un 20% con el plan anual y el precio queda congelado!
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleCreateSubscription}
              disabled={!selectedPlan}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Contratar Plan
            </button>
          </div>
        </>
      )}

      {/* Historial de Pagos */}
      {subscription && (
        <div className="mt-8">
          <PaymentHistory />
        </div>
      )}
    </div>
  )
}
