// app/api/subscriptions-ars/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPreApproval } from '@/lib/mercadopago'
import { sendSubscriptionCreatedEmail, sendSetupFeePendingEmail } from '@/lib/email'
import { z } from 'zod'

const createSubscriptionSchema = z.object({
  planSlug: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']),
  addonSlugs: z.array(z.string()).optional().default([])
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener usuario y negocio
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        business: {
          include: {
            subscriptionARS: true
          }
        }
      }
    })

    if (!user?.businessId) {
      return NextResponse.json(
        { error: 'Usuario sin negocio asignado' },
        { status: 400 }
      )
    }

    // Verificar si ya tiene una suscripción activa
    if (user.business?.subscriptionARS) {
      return NextResponse.json(
        { error: 'Ya tiene una suscripción activa' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { planSlug, billingCycle, addonSlugs } = createSubscriptionSchema.parse(body)

    // Obtener plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { slug: planSlug, isActive: true }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    // Obtener addons si hay
    const addons = addonSlugs.length > 0
      ? await prisma.addon.findMany({
          where: {
            slug: { in: addonSlugs },
            isActive: true
          }
        })
      : []

    // Calcular precios
    const planPrice = billingCycle === 'yearly' 
      ? Number(plan.priceYearly) 
      : Number(plan.priceMonthly)
    
    const addonsTotal = addons.reduce((sum, addon) => sum + Number(addon.priceMonthly), 0)
    const total = planPrice + addonsTotal

    // Calcular fechas
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    if (billingCycle === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    }

    // Crear suscripción en la base de datos
    const subscription = await prisma.subscriptionARS.create({
      data: {
        businessId: user.businessId,
        planId: plan.id,
        status: 'pending',
        billingCycle,
        currentPeriodStart,
        currentPeriodEnd,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        totalAddons: addonsTotal,
        totalMonthly: total,
        setupFeeAmount: plan.setupFee,
        setupFeePaid: false
      }
    })

    // Crear addons
    if (addons.length > 0) {
      await prisma.subscriptionAddon.createMany({
        data: addons.map(addon => ({
          subscriptionId: subscription.id,
          addonId: addon.id,
          price: addon.priceMonthly
        }))
      })
    }

    // Si el ciclo es mensual, crear suscripción recurrente en MercadoPago
    let mercadopagoData = null
    if (billingCycle === 'monthly' && user.business) {
      try {
        mercadopagoData = await createPreApproval({
          reason: `${plan.name} - VendiMax`,
          autoRecurring: {
            frequency: 1,
            frequencyType: 'months',
            transactionAmount: total,
            currencyId: 'ARS'
          },
          backUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion?status=success`,
          payer_email: user.business.email,
          external_reference: subscription.id,
          status: 'pending'
        })

        // Actualizar con el ID de MercadoPago
        await prisma.subscriptionARS.update({
          where: { id: subscription.id },
          data: {
            mercadopagoPreapprovalId: mercadopagoData.id
          }
        })
      } catch (error) {
        console.error('Error al crear suscripción en MercadoPago:', error)
        // No fallar, seguir con el flujo
      }
    }

    // Enviar emails de confirmación
    if (user.business?.email) {
      // 1. Email de suscripción creada
      await sendSubscriptionCreatedEmail({
        to: user.business.email,
        businessName: user.business.name,
        planName: plan.name,
        planPrice,
        cycle: billingCycle,
        addons: addons.map(a => ({ name: a.name, price: Number(a.priceMonthly) })),
        total,
        setupFeeAmount: Number(plan.setupFee)
      }).catch(err => console.error('Error enviando email de suscripción creada:', err))

      // 2. Email de Setup Fee pendiente
      await sendSetupFeePendingEmail({
        to: user.business.email,
        businessName: user.business.name,
        setupFeeAmount: Number(plan.setupFee),
        paymentLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/suscripcion?setupfee=pending`
      }).catch(err => console.error('Error enviando email de setup fee:', err))
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        planName: plan.name,
        billingCycle,
        total,
        setupFee: Number(plan.setupFee),
        mercadopagoInitPoint: mercadopagoData?.init_point,
        needsSetupFee: true
      }
    })

  } catch (error) {
    console.error('Error al crear suscripción:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al crear suscripción' },
      { status: 500 }
    )
  }
}

// Obtener planes disponibles
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' }
    })

    const addons = await prisma.addon.findMany({
      where: { isActive: true }
    })

    return NextResponse.json({
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        priceMonthly: Number(plan.priceMonthly),
        priceYearly: Number(plan.priceYearly),
        setupFee: Number(plan.setupFee),
        maxUsers: plan.maxUsers,
        maxProducts: plan.maxProducts,
        maxSales: plan.maxSales,
        features: plan.features
      })),
      addons: addons.map(addon => ({
        id: addon.id,
        name: addon.name,
        slug: addon.slug,
        description: addon.description,
        priceMonthly: Number(addon.priceMonthly),
        features: addon.features
      }))
    })
  } catch (error) {
    console.error('Error al obtener planes:', error)
    return NextResponse.json(
      { error: 'Error al obtener planes' },
      { status: 500 }
    )
  }
}
