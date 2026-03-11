import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seeding...')

  // Crear usuario administrador de prueba
  const adminPassword = await hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vendimax.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@vendimax.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })
  console.log('✅ Usuario admin creado:', admin.email)

  // Crear negocio de prueba con admin como owner
  const business = await prisma.business.upsert({
    where: { email: 'admin@vendimax.com' },
    update: {},
    create: {
      name: 'Negocio de Prueba',
      email: 'admin@vendimax.com',
      ownerId: admin.id,
      planType: 'PRO',
    },
  })
  console.log('✅ Negocio creado:', business.name)

  // Actualizar admin con businessId
  await prisma.user.update({
    where: { id: admin.id },
    data: { businessId: business.id },
  })

  // Crear usuario vendedor de prueba
  const vendedorPassword = await hash('vendedor123', 10)
  const vendedor = await prisma.user.upsert({
    where: { email: 'vendedor@vendimax.com' },
    update: {},
    create: {
      name: 'Juan Pérez',
      email: 'vendedor@vendimax.com',
      passwordHash: vendedorPassword,
      role: 'VENDEDOR',
      businessId: business.id,
      isActive: true,
    },
  })
  console.log('✅ Usuario vendedor creado:', vendedor.email)

  // Crear categorías
  const categoria1 = await prisma.category.upsert({
    where: { id: 'cat-1' },
    update: {},
    create: {
      id: 'cat-1',
      name: 'Electrónica',
      description: 'Productos electrónicos y tecnología',
    },
  })

  const categoria2 = await prisma.category.upsert({
    where: { id: 'cat-2' },
    update: {},
    create: {
      id: 'cat-2',
      name: 'Alimentos',
      description: 'Productos alimenticios',
    },
  })

  console.log('✅ Categorías creadas')

  // Crear productos
  await prisma.product.createMany({
    data: [
      {
        businessId: business.id,
        name: 'Laptop HP',
        sku: 'LAPTOP-001',
        barcode: '7501234567890',
        price: 15000,
        cost: 12000,
        minStock: 3,
        categoryId: categoria1.id,
      },
      {
        businessId: business.id,
        name: 'Mouse Logitech',
        sku: 'MOUSE-001',
        barcode: '7501234567891',
        price: 350,
        cost: 250,
        minStock: 10,
        categoryId: categoria1.id,
      },
      {
        businessId: business.id,
        name: 'Café 1kg',
        sku: 'CAFE-001',
        barcode: '7501234567892',
        price: 120,
        cost: 80,
        minStock: 20,
        categoryId: categoria2.id,
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Productos creados')

  // Crear clientes
  await prisma.client.createMany({
    data: [
      {
        name: 'María García',
        email: 'maria@example.com',
        phone: '+52 555 1234567',
        businessId: business.id,
      },
      {
        name: 'Carlos López',
        email: 'carlos@example.com',
        phone: '+52 555 7654321',
        businessId: business.id,
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Clientes creados')

  // Crear proveedores
  await prisma.supplier.createMany({
    data: [
      {
        name: 'Tech Supplies SA',
        email: 'ventas@techsupplies.com',
        phone: '+52 555 1111111',
      },
      {
        name: 'Alimentos del Norte',
        email: 'contacto@alimentosnorte.com',
        phone: '+52 555 2222222',
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Proveedores creados')

  console.log('🎉 Seeding completado!')
}

main()
  .catch((e) => {
    console.error('❌ Error durante seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
