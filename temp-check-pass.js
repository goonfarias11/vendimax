const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
(async () => {
  const p = new PrismaClient();
  const u = await p.user.findUnique({ where: { email: "demo@vendimax.test" } });
  console.log("hash:", u?.passwordHash);
  const ok = u ? await bcrypt.compare("password", u.passwordHash) : false;
  console.log("compare password =>", ok);
  await p.$disconnect();
})();
