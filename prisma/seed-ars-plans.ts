import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding planes ARS...')

  // Crear planes
  const emprendedor = await prisma.subscriptionPlan.upsert({
    where: { slug: 'emprendedor' },
    update: {},
    create: {
      name: 'Emprendedor',
      slug: 'emprendedor',
      description: 'Ideal para emprendimientos y negocios pequeños',
      priceMonthly: 20000,
      priceYearly: 192000, // 20% descuento
      setupFee: 60000,
      maxUsers: 2,
      maxProducts: 500,
      maxSales: 200,
      features: JSON.stringify([
        'Gestión de ventas',
        'Control de stock',
        'Clientes y proveedores',
        'Reportes básicos',
        'Cierre de caja',
        '2 usuarios',
        'Hasta 500 productos',
        'Hasta 200 ventas/mes'
      ]),
      position: 1
    }
  })

  const pyme = await prisma.subscriptionPlan.upsert({
    where: { slug: 'pyme' },
    update: {},
    create: {
      name: 'Pyme',
      slug: 'pyme',
      description: 'Para pequeñas y medianas empresas en crecimiento',
      priceMonthly: 50000,
      priceYearly: 480000, // 20% descuento
      setupFee: 60000,
      maxUsers: 5,
      maxProducts: 2000,
      maxSales: 1000,
      features: JSON.stringify([
        'Todo lo de Emprendedor',
        'Facturación electrónica (AFIP)',
        'Múltiples sucursales',
        'Reportes avanzados',
        'Análisis de rentabilidad',
        '5 usuarios',
        'Hasta 2000 productos',
        'Hasta 1000 ventas/mes',
        'Soporte prioritario'
      ]),
      position: 2
    }
  })

  const full = await prisma.subscriptionPlan.upsert({
    where: { slug: 'full' },
    update: {},
    create: {
      name: 'Full',
      slug: 'full',
      description: 'Solución completa para empresas en expansión',
      priceMonthly: 120000,
      priceYearly: 1152000, // 20% descuento
      setupFee: 60000,
      maxUsers: null, // ilimitado
      maxProducts: null, // ilimitado
      maxSales: null, // ilimitado
      features: JSON.stringify([
        'Todo lo de Pyme',
        'Usuarios ilimitados',
        'Productos ilimitados',
        'Ventas ilimitadas',
        'API para integraciones',
        'Exportación personalizada',
        'Soporte VIP 24/7',
        'Capacitación incluida',
        'Backups diarios automáticos'
      ]),
      position: 3
    }
  })

  // Crear addons
  const mercadolibre = await prisma.addon.upsert({
    where: { slug: 'mercadolibre' },
    update: {},
    create: {
      name: 'Integración MercadoLibre',
      slug: 'mercadolibre',
      description: 'Sincroniza tu inventario y ventas con MercadoLibre',
      priceMonthly: 15000,
      features: JSON.stringify([
        'Sincronización automática de stock',
        'Publicación masiva de productos',
        'Gestión de ventas ML desde VendiMax',
        'Actualizaciones en tiempo real'
      ])
    }
  })

  const tienda = await prisma.addon.upsert({
    where: { slug: 'tienda-online' },
    update: {},
    create: {
      name: 'Tienda Online',
      slug: 'tienda-online',
      description: 'Tu propia tienda online con carrito de compras',
      priceMonthly: 20000,
      features: JSON.stringify([
        'Tienda online personalizable',
        'Carrito de compras',
        'Pasarela de pagos integrada',
        'Dominio personalizado',
        'SEO optimizado'
      ])
    }
  })

  const analisis = await prisma.addon.upsert({
    where: { slug: 'analisis-avanzado' },
    update: {},
    create: {
      name: 'Análisis Avanzado',
      slug: 'analisis-avanzado',
      description: 'Dashboard con métricas avanzadas e inteligencia de negocio',
      priceMonthly: 10000,
      features: JSON.stringify([
        'Dashboard con KPIs personalizables',
        'Predicción de ventas',
        'Análisis de tendencias',
        'Reportes personalizados',
        'Alertas inteligentes'
      ])
    }
  })

  console.log('✅ Planes creados:')
  console.log(`  - ${emprendedor.name}: $${emprendedor.priceMonthly}/mes`)
  console.log(`  - ${pyme.name}: $${pyme.priceMonthly}/mes`)
  console.log(`  - ${full.name}: $${full.priceMonthly}/mes`)
  
  console.log('\n✅ Addons creados:')
  console.log(`  - ${mercadolibre.name}: +$${mercadolibre.priceMonthly}/mes`)
  console.log(`  - ${tienda.name}: +$${tienda.priceMonthly}/mes`)
  console.log(`  - ${analisis.name}: +$${analisis.priceMonthly}/mes`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
