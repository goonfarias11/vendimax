import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          logger.debug("Intentando autenticar:", credentials?.email)
          
          if (!credentials?.email || !credentials?.password) {
            logger.debug("Credenciales vacías")
            return null
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string
            }
          })

          if (!user) {
            logger.debug("Usuario no encontrado:", credentials.email)
            return null
          }

          logger.debug("Usuario encontrado:", user.email)

          const isPasswordValid = await compare(
            credentials.password as string,
            user.passwordHash
          )

          if (!isPasswordValid) {
            logger.debug("Contraseña incorrecta")
            return null
          }

          if (!user.isActive) {
            logger.debug("Usuario inactivo")
            return null
          }

          logger.debug("Autenticación exitosa")
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            businessId: user.businessId
          }
        } catch (error) {
          logger.error("Error en authorize:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id
          token.role = user.role
          token.businessId = user.businessId
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
          session.user.businessId = token.businessId as string | null
        }
        return session
      } catch (error) {
        logger.error("Error en session callback:", error)
        return session
      }
    }
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
