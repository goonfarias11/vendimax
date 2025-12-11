import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSkeletonProps {
  type?: 'table' | 'form' | 'cards' | 'dashboard'
  rows?: number
}

export function LoadingSkeleton({ type = 'table', rows = 5 }: LoadingSkeletonProps) {
  if (type === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg border">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-lg border">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-[300px] w-full" />
        </div>

        {/* Table */}
        <div className="bg-white p-6 rounded-lg border">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'form') {
    return (
      <div className="space-y-4 max-w-2xl">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 mt-6" />
      </div>
    )
  }

  // table (default)
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
