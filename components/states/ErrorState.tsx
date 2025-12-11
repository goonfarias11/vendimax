import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  showRetry?: boolean
}

export function ErrorState({ 
  title = "Error al cargar", 
  message, 
  onRetry,
  showRetry = true 
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  )
}
