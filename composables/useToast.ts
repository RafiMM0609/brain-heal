export type ToastType = 'success' | 'info' | 'warning' | 'error'

export interface ToastAction {
  label: string
  /** Material Symbols icon name rendered before the label. */
  icon?: string
  run: () => void | Promise<void>
}

export interface ToastData {
  id: number
  message: string
  type: ToastType
  action?: ToastAction
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  const toastState = useState<ToastData | null>('global_app_toast_state', () => null)

  function showToast(
    message: string,
    type: ToastType = 'success',
    duration = 3000,
    action?: ToastAction
  ) {
    if (toastTimer) {
      clearTimeout(toastTimer)
    }

    const id = Date.now()
    toastState.value = { id, message, type, action }

    toastTimer = setTimeout(() => {
      if (toastState.value?.id === id) {
        toastState.value = null
      }
    }, duration)
  }

  /**
   * Convenience wrapper for the destructive-action pattern.
   * Audit F-02: deleting a task was permanent; this keeps the toast on screen
   * long enough (6s) for the user to take it back.
   */
  function showUndoToast(message: string, onUndo: () => void | Promise<void>, duration = 6000) {
    showToast(message, 'info', duration, {
      label: 'Undo',
      icon: 'material-symbols:undo',
      run: onUndo
    })
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
    showUndoToast,
    hideToast
  }
}
