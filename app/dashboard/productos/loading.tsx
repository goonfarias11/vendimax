export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
        <div className="h-10 w-40 bg-muted animate-pulse rounded"></div>
      </div>
      <div className="h-12 bg-muted animate-pulse rounded"></div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded"></div>
        ))}
      </div>
    </div>
  )
}
