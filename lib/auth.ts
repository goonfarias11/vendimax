import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Email from "next-auth/providers/email"
import { compare, hash } from "bcrypt"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: { params: { prompt: "select_account" } },
      })
    : null

// Email provider deshabilitado (se quitó el link mágico a petición del usuario)
const emailProvider = null

const allowedAdminEmails =
  process.env.ADMIN_SSO_EMAILS?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean) || []

const allowedWorkspaceDomain = process.env.ADMIN_GOOGLE_WORKSPACE_DOMAIN?.toLowerCase()

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          logger.debug("Intentando autenticar:", credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            logger.debug("Credenciales vacias")
            return null
          }

          const email = (credentials.email as string).toLowerCase()
          const user = await prisma.user.findUnique({
            where: { email },
            include: { business: true },
          })

          if (!user) {
            // Autoprovisionar al creador si coincide con el email admin configurado
            const adminEmailEnv =
              process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
              process.env.ADMIN_SSO_EMAILS?.split(",").map((e) => e.trim().toLowerCase()).find(Boolean)

            const isOwner = adminEmailEnv && adminEmailEnv.toLowerCase() === email

            if (isOwner) {
              const passwordHash = await hash(credentials.password as string, 10)
              const created = await prisma.user.create({
                data: {
                  email,
                  name: credentials.email as string,
                  passwordHash,
                  role: "OWNER",
                  adminRole: "super_admin",
                  isActive: true,
                },
              })
              logger.info("Autoprovision admin por credentials", { email })
              return {
                id: created.id,
                name: created.name,
                email: created.email,
                role: created.role,
                adminRole: created.adminRole,
                businessId: created.businessId,
              }
            }

            logger.debug("Usuario no encontrado:", credentials.email)
            return null
          }

          // Si el usuario no tiene businessId pero tiene un business, asignarlo
          let businessId = user.businessId
          if (!businessId && user.business) {
            businessId = user.business.id
            // Actualizar el usuario con el businessId si no lo tiene
            await prisma.user.update({
              where: { id: user.id },
              data: { businessId },
            })
          }

          // Forzar rol OWNER para el correo configurado
          const ownerEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase()
          if (ownerEmail && email === ownerEmail && (user.role !== "OWNER" || user.adminRole !== "super_admin")) {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: "OWNER", adminRole: "super_admin", isActive: true },
            })
            user.role = "OWNER"
            user.adminRole = "super_admin"
            user.isActive = true
          }

          const isPasswordValid = await compare(credentials.password as string, user.passwordHash)
          if (!isPasswordValid) {
            logger.debug("Contrasena incorrecta")
            return null
          }

          if (!user.isActive) {
            logger.debug("Usuario inactivo")
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            adminRole: user.adminRole,
            businessId,
          }
        } catch (error) {
          logger.error("Error en authorize:", error)
          return null
        }
      },
    }),
    ...(googleProvider ? [googleProvider] : []),
    ...(emailProvider ? [emailProvider] : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" && account?.provider !== "email") return true

      const email = (user?.email || (profile as any)?.email || "").toLowerCase()
      if (!email) return false

      if (allowedWorkspaceDomain && !email.endsWith(`@${allowedWorkspaceDomain}`)) {
        logger.warn("SSO rechazado por dominio", { email })
        return false
      }

      if (allowedAdminEmails.length > 0 && !allowedAdminEmails.includes(email)) {
        logger.warn("SSO rechazado por allowlist", { email })
        return false
      }

      // Si es el owner configurado, asegurar rol OWNER/super_admin
      const ownerEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase()
      const isOwner = ownerEmail && email === ownerEmail

      const existing = await prisma.user.findUnique({ 
        where: { email },
        include: { business: true },
      })

      if (!existing) {
        const randomPass = crypto.randomBytes(32).toString("hex")
        const created = await prisma.user.create({
          data: {
            email,
            name: user?.name || email,
            passwordHash: await hash(randomPass, 10),
            role: isOwner ? "OWNER" : "ADMIN",
            adminRole: "super_admin",
            isActive: true,
          },
        })
        logger.info("SSO/magic creo usuario admin", { email })
        return true
      }

      // Si el usuario no tiene businessId pero tiene un business, asignarlo
      if (!existing.businessId && existing.business) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { businessId: existing.business.id },
        })
      }

      if (isOwner && existing.role !== "OWNER") {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: "OWNER", adminRole: "super_admin", isActive: true },
        })
      }

      if (existing.adminRole === "user") {
        await prisma.user.update({ where: { id: existing.id }, data: { adminRole: "admin" } })
      }

      if (!existing.isActive) return false
      return true
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = (user as any).id
          token.role = (user as any).role
          token.adminRole = (user as any).adminRole
          token.businessId = (user as any).businessId
        } else if (token.id && !token.businessId) {
          // Si no hay businessId en el token, buscarlo en la DB
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { business: true },
          })
          if (dbUser && dbUser.business) {
            token.businessId = dbUser.business.id
          }
        }
        return token
      } catch (error) {
        logger.error("Error en JWT callback:", error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string
          session.user.role = token.role as string
          session.user.adminRole = token.adminRole as string
          session.user.businessId = token.businessId as string | null
        }
        return session
      } catch (error) {
        logger.error("Error en session callback:", error)
        return session
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  basePath: "/api/auth",
} satisfies NextAuthConfig

export const authOptions = authConfig
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
