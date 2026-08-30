export interface ToastData {
  id: number
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  const toastState = useState<ToastData | null>('global_app_toast_state', () => null)

  function showToast(message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success', duration = 3000) {
    if (toastTimer) {
      clearTimeout(toastTimer)
    }

    const id = Date.now()
    toastState.value = {
      id,
      message,
      type
    }

    toastTimer = setTimeout(() => {
      if (toastState.value?.id === id) {
        toastState.value = null
      }
    }, duration)
  }

  function hideToast() {
    if (toastTimer) {
      clearTimeout(toastTimer)
    }
    toastState.value = null
  }

  return {
    toastState,
    showToast,
    hideToast
  }
}
