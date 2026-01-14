import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showProducts() {
  const products = await prisma.product.findMany({ take: 5 });
  console.log(JSON.stringify(products, null, 2));
  await prisma.$disconnect();
}

showProducts();
