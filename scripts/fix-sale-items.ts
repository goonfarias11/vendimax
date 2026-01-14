import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSaleItems() {
  try {
    console.log('🔧 Corrigiendo items de venta con precio 0...\n');

    const sales = await prisma.sale.findMany({
      include: {
        saleItems: {
          include: {
            product: true
          }
        }
      }
    });

    let fixedItems = 0;
    let fixedSales = 0;

    for (const sale of sales) {
      let saleNeedsRecalc = false;

      for (const item of sale.saleItems) {
        if (Number(item.price) === 0 && Number(item.product.price) > 0) {
          // Actualizar el item con el precio del producto
          const newPrice = Number(item.product.price);
          const newSubtotal = Number(item.quantity) * newPrice;

          await prisma.saleItem.update({
            where: { id: item.id },
            data: {
              price: newPrice,
              subtotal: newSubtotal
            }
          });

          console.log(`✅ Item actualizado: ${item.product.name}`);
          console.log(`   Precio: $0 → $${newPrice}`);
          console.log(`   Subtotal: $0 → $${newSubtotal}\n`);

          fixedItems++;
          saleNeedsRecalc = true;
        }
      }

      // Recalcular totales de la venta
      if (saleNeedsRecalc) {
        const updatedItems = await prisma.saleItem.findMany({
          where: { saleId: sale.id }
        });

        const newSubtotal = updatedItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
        const newTotal = newSubtotal - Number(sale.discount);

        await prisma.sale.update({
          where: { id: sale.id },
          data: {
            subtotal: newSubtotal,
            total: newTotal
          }
        });

        console.log(`📊 Venta #${sale.ticketNumber} recalculada:`);
        console.log(`   Subtotal: $${Number(sale.subtotal)} → $${newSubtotal}`);
        console.log(`   Total: $${Number(sale.total)} → $${newTotal}\n`);

        fixedSales++;
      }
    }

    console.log('\n✅ Proceso completado:');
    console.log(`   Items corregidos: ${fixedItems}`);
    console.log(`   Ventas recalculadas: ${fixedSales}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSaleItems();
