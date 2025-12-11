import { toast } from 'sonner'

export function useToastError() {
  const showError = (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
    })
  }

  const showSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    })
  }

  const showWarning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    })
  }

  const showInfo = (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 3000,
    })
  }

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo
  }
}
