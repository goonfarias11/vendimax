import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getTicketDataBySaleId } from "@/lib/ticket/ticket-service"
import { TicketPreviewClient } from "@/components/ticket/ticket-preview-client"

export const dynamic = "force-dynamic"

type TicketPreviewPageProps = {
  params: Promise<{ id: string }>
}

export default async function TicketPreviewPage({ params }: TicketPreviewPageProps) {
  const { id } = await params
  const session = await auth()
  const businessId = session?.user?.businessId

  if (!businessId) {
    redirect("/login")
  }

  const ticket = await getTicketDataBySaleId(id, businessId)
  if (!ticket) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Ticket #{ticket.ticketNumber}</h1>
        <p className="text-muted-foreground">Vista previa, impresión o descarga en PDF.</p>
      </div>
      {/* Cliente: maneja botones y acciones */}
      <TicketPreviewClient ticket={ticket} />
    </div>
  )
}
