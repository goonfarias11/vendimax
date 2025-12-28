/**
 * Script para actualizar los planes de suscripción oficiales
 * 
 * Planes definitivos:
 * - BÁSICO: $8.500/mes
 * - PRO: $14.000/mes (Más Popular)
 * - FULL: $22.000/mes
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PLANES_OFICIALES = [
  {
    name: 'Básico',
    slug: 'basico',
    description: 'Ideal para emprendimientos y negocios pequeños',
    priceMonthly: 8500,
    priceYearly: 85000, // 10 meses de descuento
    setupFee: 0,
    maxUsers: 3,
    maxProducts: 500,
    maxSales: 1000,
    maxLocations: 1,
    hasAdvancedReports: false,
    hasIntegrations: false,
    hasCurrentAccounts: false,
    hasAPI: false,
    supportLevel: 'email',
    isMostPopular: false,
    position: 1,
    features: [
      '3 usuarios',
      '500 productos',
      '1.000 ventas por mes',
      '1 ubicación',
      'Reportes básicos',
      'Soporte por email'
    ]
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Para negocios en crecimiento que necesitan más funcionalidades',
    priceMonthly: 14000,
    priceYearly: 140000, // 10 meses de descuento
    setupFee: 0,
    maxUsers: 10,
    maxProducts: 5000,
    maxSales: 10000,
    maxLocations: 3,
    hasAdvancedReports: true,
    hasIntegrations: true,
    hasCurrentAccounts: true,
    hasAPI: false,
    supportLevel: 'priority',
    isMostPopular: true,
    position: 2,
    features: [
      '10 usuarios',
      '5.000 productos',
      '10.000 ventas por mes',
      '3 ubicaciones',
      'Reportes avanzados',
      'Integraciones',
      'Cuenta corriente de clientes',
      'Soporte prioritario'
    ]
  },
  {
    name: 'Full',
    slug: 'full',
    description: 'Sin límites para empresas que buscan máximo rendimiento',
    priceMonthly: 22000,
    priceYearly: 220000, // 10 meses de descuento
    setupFee: 0,
    maxUsers: null, // Ilimitado
    maxProducts: null, // Ilimitado
    maxSales: null, // Ilimitado
    maxLocations: null, // Ilimitado
    hasAdvancedReports: true,
    hasIntegrations: true,
    hasCurrentAccounts: true,
    hasAPI: true,
    supportLevel: '24/7',
    isMostPopular: false,
    position: 3,
    features: [
      'Usuarios ilimitados',
      'Productos ilimitados',
      'Ventas ilimitadas',
      'Ubicaciones ilimitadas',
      'Reportes personalizados',
      'API personalizada',
      'Todas las integraciones',
      'Cuenta corriente de clientes',
      'Gerente de cuenta dedicado',
      'Soporte 24/7'
    ]
  }
]

async function main() {
  console.log('🔄 Actualizando planes de suscripción...\n')

  for (const planData of PLANES_OFICIALES) {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { slug: planData.slug }
    })

    if (existingPlan) {
      // Actualizar plan existente
      const updated = await prisma.subscriptionPlan.update({
        where: { slug: planData.slug },
        data: {
          name: planData.name,
          description: planData.description,
          priceMonthly: planData.priceMonthly,
          priceYearly: planData.priceYearly,
          setupFee: planData.setupFee,
          maxUsers: planData.maxUsers,
          maxProducts: planData.maxProducts,
          maxSales: planData.maxSales,
          maxLocations: planData.maxLocations,
          hasAdvancedReports: planData.hasAdvancedReports,
          hasIntegrations: planData.hasIntegrations,
          hasCurrentAccounts: planData.hasCurrentAccounts,
          hasAPI: planData.hasAPI,
          supportLevel: planData.supportLevel,
          isMostPopular: planData.isMostPopular,
          position: planData.position,
          features: planData.features,
          isActive: true
        }
      })
      console.log(`✅ Plan "${updated.name}" actualizado (ID: ${updated.id})`)
    } else {
      // Crear nuevo plan
      const created = await prisma.subscriptionPlan.create({
        data: {
          name: planData.name,
          slug: planData.slug,
          description: planData.description,
          priceMonthly: planData.priceMonthly,
          priceYearly: planData.priceYearly,
          setupFee: planData.setupFee,
          maxUsers: planData.maxUsers,
          maxProducts: planData.maxProducts,
          maxSales: planData.maxSales,
          maxLocations: planData.maxLocations,
          hasAdvancedReports: planData.hasAdvancedReports,
          hasIntegrations: planData.hasIntegrations,
          hasCurrentAccounts: planData.hasCurrentAccounts,
          hasAPI: planData.hasAPI,
          supportLevel: planData.supportLevel,
          isMostPopular: planData.isMostPopular,
          position: planData.position,
          features: planData.features,
          isActive: true
        }
      })
      console.log(`✅ Plan "${created.name}" creado (ID: ${created.id})`)
    }
  }

  // Listar todos los planes actualizados
  console.log('\n📋 Planes activos en el sistema:\n')
  const allPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' }
  })

  for (const plan of allPlans) {
    console.log(`${plan.isMostPopular ? '⭐' : '  '} ${plan.name.toUpperCase()}`)
    console.log(`   Precio: $${Number(plan.priceMonthly).toLocaleString('es-AR')} ARS/mes`)
    console.log(`   Usuarios: ${plan.maxUsers || 'Ilimitados'}`)
    console.log(`   Productos: ${plan.maxProducts?.toLocaleString('es-AR') || 'Ilimitados'}`)
    console.log(`   Ventas/mes: ${plan.maxSales?.toLocaleString('es-AR') || 'Ilimitadas'}`)
    console.log(`   Ubicaciones: ${plan.maxLocations || 'Ilimitadas'}`)
    console.log(`   Reportes: ${plan.hasAdvancedReports ? 'Avanzados' : 'Básicos'}`)
    console.log(`   Soporte: ${plan.supportLevel}`)
    console.log('')
  }

  console.log('✅ Actualización completada exitosamente\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
