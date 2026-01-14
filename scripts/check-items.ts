import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSaleItems() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        saleItems: {
          include: {
            product: true
          }
        }
      }
    });

    console.log('\n📦 VERIFICACIÓN DE ITEMS DE VENTA:\n');

    sales.forEach(sale => {
      console.log(`🎫 Venta #${sale.ticketNumber} (${sale.id})`);
      sale.saleItems.forEach(item => {
        console.log(`   📌 Item ${item.id}:`);
        console.log(`      Producto: ${item.product.name}`);
        console.log(`      Cantidad: ${item.quantity}`);
        console.log(`      Precio: ${item.price} (tipo: ${typeof item.price})`);
        console.log(`      Subtotal: ${item.subtotal}`);
        console.log(`      Precio del producto en BD: ${item.product.price}`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSaleItems();
