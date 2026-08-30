import { ref, readonly } from 'vue'

export interface ToastData {
  id: number
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
}

const toastState = ref<ToastData | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
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
    toastState: readonly(toastState),
    showToast,
    hideToast
  }
}
