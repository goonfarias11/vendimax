/**
 * Script para probar el sistema de gestión de trials
 * 
 * Uso:
 * ts-node scripts/test-trial-system.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing Trial System\n')

  // 1. Buscar trials activos
  console.log('📋 Trials activos:')
  const activeTrials = await prisma.subscriptionARS.findMany({
    where: {
      freeTrial: true,
      status: 'active',
    },
    include: {
      business: {
        select: {
          name: true,
          email: true,
        },
      },
      plan: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      trialEndsAt: 'asc',
    },
  })

  if (activeTrials.length === 0) {
    console.log('  ❌ No hay trials activos\n')
  } else {
    for (const trial of activeTrials) {
      const daysRemaining = trial.trialEndsAt
        ? Math.ceil((trial.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0

      console.log(`  📦 ${trial.business.name}`)
      console.log(`     Email: ${trial.business.email}`)
      console.log(`     Plan: ${trial.plan.name}`)
      console.log(`     Expira: ${trial.trialEndsAt?.toLocaleDateString()}`)
      console.log(`     Días restantes: ${daysRemaining}`)
      // console.log(`     Notificado: ${trial.trialNotificationSent ? '✅' : '❌'}`)
      console.log('')
    }
  }

  // 2. Trials que necesitan notificación (3 días)
  const now = new Date()
  const threeDaysFromNow = new Date(now)
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  console.log('⏰ Trials que necesitan notificación (expiran en 3 días):')
  const trialsToNotify = await prisma.subscriptionARS.findMany({
    where: {
      freeTrial: true,
      status: 'active',
      trialEndsAt: {
        gte: now,
        lte: threeDaysFromNow,
      },
      // trialNotificationSent: false,
    },
    include: {
      business: {
        select: {
          name: true,
        },
      },
    },
  })

  if (trialsToNotify.length === 0) {
    console.log('  ✅ No hay trials para notificar\n')
  } else {
    console.log(`  🔔 ${trialsToNotify.length} trials necesitan notificación:`)
    for (const trial of trialsToNotify) {
      console.log(`     - ${trial.business.name}`)
    }
    console.log('')
  }

  // 3. Trials expirados
  console.log('🚫 Trials expirados:')
  const expiredTrials = await prisma.subscriptionARS.findMany({
    where: {
      freeTrial: true,
      status: 'active',
      trialEndsAt: {
        lt: now,
      },
    },
    include: {
      business: {
        select: {
          name: true,
          planType: true,
        },
      },
    },
  })

  if (expiredTrials.length === 0) {
    console.log('  ✅ No hay trials expirados pendientes de procesar\n')
  } else {
    console.log(`  ⚠️  ${expiredTrials.length} trials expirados:`)
    for (const trial of expiredTrials) {
      console.log(`     - ${trial.business.name} (Plan actual: ${trial.business.planType})`)
    }
    console.log('')
  }

  // 4. Historial de bloqueos por trial expirado
  console.log('📊 Historial de bloqueos por trial:')
  const blockLogs = await prisma.planBlockLog.findMany({
    where: {
      type: 'EXPIRED',
      reason: {
        contains: 'Prueba gratuita',
      },
    },
    include: {
      business: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  if (blockLogs.length === 0) {
    console.log('  ℹ️  No hay bloqueos registrados\n')
  } else {
    for (const log of blockLogs) {
      console.log(`  📅 ${log.createdAt.toLocaleDateString()} - ${log.business.name}`)
      console.log(`     Razón: ${log.reason}`)
    }
    console.log('')
  }

  // 5. Estadísticas generales
  console.log('📈 Estadísticas:')
  const stats = await prisma.subscriptionARS.groupBy({
    by: ['status', 'freeTrial'],
    _count: true,
  })

  console.log('  Estado de suscripciones:')
  for (const stat of stats) {
    const type = stat.freeTrial ? 'Trial' : 'Pago'
    console.log(`    ${type} (${stat.status}): ${stat._count}`)
  }

  console.log('\n✅ Testing completado')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
