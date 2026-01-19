import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    console.log('🔍 Buscando usuarios...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        businessId: true
      }
    })
    
    console.log(`\n📋 Usuarios encontrados: ${users.length}`)
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.isActive ? 'Activo' : 'Inactivo'}`)
    })
    
    console.log('\n🔄 Reseteando contraseña de admin@vendimax.com...')
    
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const updatedUser = await prisma.user.upsert({
      where: { email: 'admin@vendimax.com' },
      update: {
        passwordHash: hashedPassword,
        isActive: true,
        role: 'ADMIN'
      },
      create: {
        email: 'admin@vendimax.com',
        passwordHash: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
        isActive: true
      }
    })
    
    console.log(`\n✅ Contraseña reseteada exitosamente`)
    console.log(`\n📧 Email: admin@vendimax.com`)
    console.log(`🔑 Contraseña: admin123`)
    console.log(`👤 Rol: ${updatedUser.role}`)
    console.log(`🎉 ¡Listo! Ya puedes iniciar sesión`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
