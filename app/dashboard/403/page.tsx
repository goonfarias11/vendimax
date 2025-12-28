import { auth } from '@/lib/auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default async function ForbiddenPage() {
  const session = await auth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
          <CardDescription className="text-base mt-2">
            No tienes permisos para acceder a esta sección
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p className="mb-2">
              <strong>Tu rol:</strong> {session?.user?.role || 'No definido'}
            </p>
            <p>
              Esta página está restringida según tu nivel de acceso. Si necesitas 
              permisos adicionales, contacta a un administrador del sistema.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Volver al Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/ventas/nueva">
                Ir a Ventas
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
