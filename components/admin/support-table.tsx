"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSupportRow } from "@/lib/admin/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type SupportTableProps = {
  tickets: AdminSupportRow[]
}

export function SupportTable({ tickets }: SupportTableProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [statusDraft, setStatusDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(tickets.map((ticket) => [ticket.id, ticket.status]))
  )
  const [priorityDraft, setPriorityDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(tickets.map((ticket) => [ticket.id, ticket.priority]))
  )
  const [messageTarget, setMessageTarget] = useState<string | null>(null)
  const [internalMessage, setInternalMessage] = useState("")

  async function patchTicket(ticketId: string, payload: Record<string, unknown>, successMessage: string) {
    try {
      setLoadingId(ticketId)
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Error inesperado" }))
        throw new Error(data.error || "No se pudo actualizar el ticket")
      }

      toast.success(successMessage)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado")
    } finally {
      setLoadingId(null)
    }
  }

  async function createInternalMessage(ticketId: string) {
    try {
      setLoadingId(ticketId)
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: internalMessage }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Error inesperado" }))
        throw new Error(data.error || "No se pudo agregar el mensaje")
      }

      toast.success("Mensaje interno agregado")
      setMessageTarget(null)
      setInternalMessage("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[1060px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Solicitante</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Mensajes</th>
              <th className="px-4 py-3">Ultima actividad</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{ticket.subject}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{ticket.lastMessage}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{ticket.requester}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={statusDraft[ticket.id]}
                    onChange={(event) =>
                      setStatusDraft((prev) => ({ ...prev, [ticket.id]: event.target.value }))
                    }
                  >
                    <option value="open">open</option>
                    <option value="pending">pending</option>
                    <option value="solved">solved</option>
                    <option value="closed">closed</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={priorityDraft[ticket.id]}
                    onChange={(event) =>
                      setPriorityDraft((prev) => ({ ...prev, [ticket.id]: event.target.value }))
                    }
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="urgent">urgent</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-700">{ticket.messagesCount}</td>
                <td className="px-4 py-3 text-slate-700">
                  {new Date(ticket.updatedAt).toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === ticket.id}
                      onClick={() =>
                        patchTicket(
                          ticket.id,
                          {
                            status: statusDraft[ticket.id],
                            priority: priorityDraft[ticket.id],
                          },
                          "Ticket actualizado"
                        )
                      }
                    >
                      Guardar cambios
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={loadingId === ticket.id}
                      onClick={() => {
                        setMessageTarget(ticket.id)
                        setInternalMessage("")
                      }}
                    >
                      Mensaje interno
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(messageTarget)} onOpenChange={(open) => !open && setMessageTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar mensaje interno</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={5}
            placeholder="Escribe la nota interna para el equipo de soporte"
            value={internalMessage}
            onChange={(event) => setInternalMessage(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageTarget(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!messageTarget || internalMessage.trim().length < 5 || loadingId === messageTarget}
              onClick={() => {
                if (!messageTarget) return
                createInternalMessage(messageTarget)
              }}
            >
              Publicar mensaje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
