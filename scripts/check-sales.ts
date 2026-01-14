import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSales() {
  try {
    const sales = await prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        saleItems: true
      }
    });

    console.log('\n📊 VERIFICACIÓN DE VENTAS EN BD:\n');
    console.log(`Total de ventas: ${sales.length}\n`);

    sales.forEach(sale => {
      console.log(`🎫 Venta #${sale.ticketNumber}`);
      console.log(`   ID: ${sale.id}`);
      console.log(`   Total: ${sale.total} (tipo: ${typeof sale.total})`);
      console.log(`   Subtotal: ${sale.subtotal}`);
      console.log(`   Descuento: ${sale.discount}`);
      console.log(`   Items: ${sale.saleItems.length}`);
      console.log(`   Created: ${sale.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSales();
