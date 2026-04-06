import Link from "next/link"
import { Button } from "@/components/ui/button"

type AdminPaginationProps = {
  basePath: string
  page: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}

function buildPageHref(
  basePath: string,
  targetPage: number,
  params: Record<string, string | undefined>
): string {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (!value || key === "page") {
      return
    }
    query.set(key, value)
  })

  query.set("page", String(targetPage))

  return `${basePath}?${query.toString()}`
}

export function AdminPagination({
  basePath,
  page,
  totalPages,
  searchParams,
}: AdminPaginationProps) {
  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <p className="text-sm text-slate-600">
        Pagina {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild disabled={prevDisabled}>
          <Link href={buildPageHref(basePath, Math.max(1, page - 1), searchParams)}>Anterior</Link>
        </Button>
        <Button variant="outline" size="sm" asChild disabled={nextDisabled}>
          <Link href={buildPageHref(basePath, Math.min(totalPages, page + 1), searchParams)}>Siguiente</Link>
        </Button>
      </div>
    </div>
  )
}
