import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para sanitizar números
const safeNumber = (value: any): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

async function sanitizeSales() {
  console.log('🧹 Iniciando sanitización de ventas...\n');

  try {
    // Obtener todas las ventas
    const sales = await prisma.sale.findMany({
      include: {
        saleItems: true,
      },
    });

    console.log(`📊 Total de ventas encontradas: ${sales.length}\n`);

    let corruptedCount = 0;
    let fixedCount = 0;

    for (const sale of sales) {
      let needsUpdate = false;
      const updates: any = {};

      // Verificar y corregir valores numéricos de la venta
      const sanitizedSubtotal = safeNumber(sale.subtotal);
      const sanitizedDiscount = safeNumber(sale.discount);
      const sanitizedTotal = safeNumber(sale.total);

      if (!Number.isFinite(Number(sale.subtotal)) || Number(sale.subtotal) !== sanitizedSubtotal) {
        updates.subtotal = sanitizedSubtotal;
        needsUpdate = true;
      }

      if (!Number.isFinite(Number(sale.discount)) || Number(sale.discount) !== sanitizedDiscount) {
        updates.discount = sanitizedDiscount;
        needsUpdate = true;
      }

      if (!Number.isFinite(Number(sale.total)) || Number(sale.total) !== sanitizedTotal) {
        updates.total = sanitizedTotal;
        needsUpdate = true;
      }

      // Recalcular totales desde items si están corruptos
      if (needsUpdate || updates.total === 0 || sanitizedTotal === 0) {
        const calculatedSubtotal = sale.saleItems.reduce((sum, item) => {
          const qty = safeNumber(item.quantity);
          const price = safeNumber(item.price);
          return sum + (qty * price);
        }, 0);

        const calculatedTotal = Math.max(0, calculatedSubtotal - sanitizedDiscount);

        updates.subtotal = calculatedSubtotal;
        updates.total = calculatedTotal;
        needsUpdate = true;

        console.log(`⚠️  Venta corrupta encontrada: ${sale.id}`);
        console.log(`   Ticket: ${sale.ticketNumber}`);
        console.log(`   Total original: ${sale.total} → Recalculado: ${calculatedTotal}`);
        console.log(`   Subtotal original: ${sale.subtotal} → Recalculado: ${calculatedSubtotal}`);
        corruptedCount++;
      }

      // Actualizar si es necesario
      if (needsUpdate) {
        await prisma.sale.update({
          where: { id: sale.id },
          data: updates,
        });
        fixedCount++;
        console.log(`✅ Venta ${sale.id} actualizada\n`);
      }

      // Sanitizar items
      for (const item of sale.saleItems) {
        let itemNeedsUpdate = false;
        const itemUpdates: any = {};

        const sanitizedQty = safeNumber(item.quantity);
        const sanitizedPrice = safeNumber(item.price);
        const sanitizedSubtotal = safeNumber(item.subtotal);

        if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) !== sanitizedQty) {
          itemUpdates.quantity = sanitizedQty || 1;
          itemNeedsUpdate = true;
        }

        if (!Number.isFinite(Number(item.price)) || Number(item.price) !== sanitizedPrice) {
          itemUpdates.price = sanitizedPrice;
          itemNeedsUpdate = true;
        }

        // Recalcular subtotal del item
        const calculatedItemSubtotal = (itemUpdates.quantity || sanitizedQty) * (itemUpdates.price || sanitizedPrice);
        if (!Number.isFinite(Number(item.subtotal)) || Math.abs(Number(item.subtotal) - calculatedItemSubtotal) > 0.01) {
          itemUpdates.subtotal = calculatedItemSubtotal;
          itemNeedsUpdate = true;
        }

        if (itemNeedsUpdate) {
          await prisma.saleItem.update({
            where: { id: item.id },
            data: itemUpdates,
          });
          console.log(`   🔧 Item ${item.id} sanitizado`);
        }
      }
    }

    console.log('\n📈 Resumen de sanitización:');
    console.log(`   Total de ventas: ${sales.length}`);
    console.log(`   Ventas corruptas: ${corruptedCount}`);
    console.log(`   Ventas corregidas: ${fixedCount}`);
    console.log('\n✅ Sanitización completada exitosamente!\n');

  } catch (error) {
    console.error('❌ Error durante la sanitización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
sanitizeSales()
  .then(() => {
    console.log('🎉 Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script falló:', error);
    process.exit(1);
  });
