import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('👤 Creando usuario admin...')
    
    // Hash de la contraseña "admin123"
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    // Crear usuario temporal sin negocio
    const user = await prisma.user.create({
      data: {
        email: 'admin@vendimax.com',
        passwordHash: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
        adminRole: 'super_admin'
      }
    })
    
    console.log(`✅ Usuario creado: ${user.email}`)
    
    // Crear negocio con el usuario como owner
    const business = await prisma.business.create({
      data: {
        name: 'VendiMax Demo',
        email: 'admin@vendimax.com',
        taxId: '20-12345678-9',
        phone: '1234567890',
        address: 'Av. Corrientes 1234',
        ownerId: user.id
      }
    })
    
    console.log(`✅ Negocio creado: ${business.name}`)
    
    // Actualizar usuario con businessId
    await prisma.user.update({
      where: { id: user.id },
      data: { businessId: business.id }
    })
    
    console.log(`📧 Email: admin@vendimax.com`)
    console.log(`🔑 Contraseña: admin123`)
    console.log('🎉 ¡Listo! Ya puedes iniciar sesión')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
