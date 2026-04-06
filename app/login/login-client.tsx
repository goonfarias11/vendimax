"use client"

import { useState, type FormEvent } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const ssoEnabled = process.env.NEXT_PUBLIC_ADMIN_SSO_ENABLED === "true"
const ssoDomain = process.env.NEXT_PUBLIC_ADMIN_SSO_DOMAIN || "tu-dominio.com"
// Magic link deshabilitado a pedido del usuario (solo login clásico y Google SSO)
const magicLinkEnabled = false
const adminEmail = "" // sección de acceso admin deshabilitada

export default function LoginClient({ nextParam }: { nextParam: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [info, setInfo] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Credenciales invalidas")
        setLoading(false)
        return
      }

      router.push(nextParam)
      router.refresh()
    } catch (err) {
      setError("Error al iniciar sesion")
      setLoading(false)
    }
  }

  const handleSso = async () => {
    setError("")
    await signIn("google", { callbackUrl: nextParam })
  }

  const handleForgotPassword = async () => {
    setError("")
    setInfo("")
    if (!email) {
      setError("Ingresa tu email para enviar el enlace de recuperación.")
      return
    }
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar la recuperación.")
        return
      }
      setInfo(data.message || "Si tu cuenta existe, te enviaremos instrucciones.")
    } catch (e) {
      setError("No se pudo iniciar la recuperación.")
    }
  }

  const handleMagicLink = async () => {
    setError("")
    setMagicSent(false)
    const res = await signIn("email", { email, callbackUrl: nextParam, redirect: false })
    if (res?.error) {
      setError("No se pudo enviar el link. Revisa la configuracion SMTP o el correo ingresado.")
      return
    }
    setMagicSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4">
      <Card className="w-full max-w-md p-8 shadow-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">VendiMax</h1>
          <p className="text-gray-600">Accede a tu cuenta</p>
        </div>

        {ssoEnabled && (
          <Button
            type="button"
            variant="outline"
            className="w-full py-3 border-gray-300"
            onClick={handleSso}
          >
            Continuar con Google ({ssoDomain})
          </Button>
        )}
        {magicLinkEnabled && (
          <Button
            type="button"
            variant="outline"
            className="w-full py-3 border-gray-300"
            onClick={handleMagicLink}
            disabled={!email}
          >
            Enviarme un link de acceso al email
          </Button>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              {info}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="********"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            disabled={loading}
          >
            {loading ? "Iniciando sesion..." : "Iniciar Sesion"}
          </Button>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
          >
            Olvidé mi contraseña
          </button>
        </form>

        {magicSent && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            Te enviamos un link de acceso a {email}. Revisa la bandeja de entrada o spam.
          </div>
        )}

        <div className="text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-blue-600 hover:text-blue-700 font-medium">
            Registrate aqui
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Volver al inicio
          </Link>
        </div>
      </Card>
    </div>
  )
}
