const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
(async () => {
  const p = new PrismaClient();
  try {
    const u = await p.user.findUnique({ where: { email: "demo@vendimax.test" } });
    console.log("found user:", !!u);
    console.log("hash:", u?.passwordHash);
    const ok = u ? await bcrypt.compare("password", u.passwordHash) : false;
    console.log("compare password =>", ok);
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();
