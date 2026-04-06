// Crear/actualizar el usuario admin para login local
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

async function main() {
  const prisma = new PrismaClient()
  const email = process.env.ADMIN_EMAIL || "gonfarias6@gmail.com"
  const password = process.env.ADMIN_PASSWORD || "Admin123!"

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      adminRole: "super_admin",
      isActive: true,
    },
    create: {
      email,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      adminRole: "super_admin",
      isActive: true,
    },
  })

  console.log("Usuario admin listo:", user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    const prisma = new PrismaClient()
    await prisma.$disconnect()
  })
