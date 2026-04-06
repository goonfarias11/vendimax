const { PrismaClient } = require("@prisma/client");
(async()=>{
  const p = new PrismaClient();
  try {
    const updated = await p.user.update({
      where: { email: "demo@vendimax.test" },
      data: {
        passwordHash: "$2b$10$EkLFPlE6GR8/drzcQxymkuFjxHTuF5FpV3fdC6Bbjnsi.IfSPngDK",
        role: "ADMIN",
        adminRole: "admin",
        isActive: true,
        businessId: "biz_demo_1"
      }
    });
    console.log("updated", updated.email);
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();
