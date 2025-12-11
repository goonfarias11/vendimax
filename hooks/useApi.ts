import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface UseApiOptions<T> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  showErrorToast?: boolean
  timeout?: number
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: (newData?: any) => Promise<T | null>
}

export function useApi<T = any>({
  url,
  method = 'GET',
  body,
  enabled = true,
  onSuccess,
  onError,
  showErrorToast = true,
  timeout = 30000
}: UseApiOptions<T>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (customBody?: any) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      setLoading(true)
      setError(null)

      const options: RequestInit = {
        method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      }

      if (method !== 'GET' && (body || customBody)) {
        options.body = JSON.stringify(customBody || body)
      }

      const response = await fetch(url, options)
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `Error ${response.status}`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setData(result)
      onSuccess?.(result)
      return result

    } catch (err: any) {
      const errorMessage = err.name === 'AbortError' 
        ? 'La solicitud tardó demasiado tiempo' 
        : err.message || 'Error al cargar los datos'
      
      setError(errorMessage)
      onError?.(errorMessage)
      
      if (showErrorToast) {
        toast.error('Error', {
          description: errorMessage
        })
      }
      
      return null

    } finally {
      setLoading(false)
      clearTimeout(timeoutId)
    }
  }, [url, method, body, timeout, onSuccess, onError, showErrorToast])

  useEffect(() => {
    if (enabled && method === 'GET') {
      fetchData()
    }
  }, [enabled, method, fetchData])

  const mutate = useCallback(async (newData?: any) => {
    return fetchData(newData)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate
  }
}
