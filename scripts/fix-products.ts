import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProducts() {
  try {
    console.log('🔧 Actualizando productos sin precio...\n');

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { price: null },
          { price: 0 }
        ]
      }
    });

    console.log(`Encontrados ${products.length} productos sin precio\n`);

    for (const product of products) {
      // Usar el costo + 30% si existe, sino poner un precio por defecto
      const newPrice = product.cost && Number(product.cost) > 0 
        ? Number(product.cost) * 1.3 
        : 1000;

      await prisma.product.update({
        where: { id: product.id },
        data: { price: newPrice }
      });

      console.log(`✅ ${product.name}: $0 → $${newPrice.toFixed(2)}`);
    }

    console.log('\n✅ Productos actualizados!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProducts();
