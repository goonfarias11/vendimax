const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async()=>{ const c = await p.productVariant.count(); console.log("variants", c); await p.$disconnect(); })().catch(async (e)=>{ console.error(e); await p.$disconnect(); process.exit(1);});
