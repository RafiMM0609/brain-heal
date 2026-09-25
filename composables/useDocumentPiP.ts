import { createPiPDocumentLayout, updatePiPDisplay, type PiPElements } from '~/utils/pipRenderer'

const pipWindow = ref<Window | null>(null)
const isSupported = ref<boolean>(false)

export function useDocumentPiP() {
  const focusStore = useFocusStore()
  let pipElements: PiPElements | null = null

  onMounted(() => {
    isSupported.value = typeof window !== 'undefined' && 'documentPictureInPicture' in window
  })

  function syncDisplay() {
    if (!pipWindow.value || !pipElements) return
    updatePiPDisplay(pipElements, {
      formattedTime: focusStore.formattedTime,
      activeTaskTitle: focusStore.activeTaskTitle,
      mode: focusStore.mode,
      isRunning: focusStore.isRunning
    })
  }

  // Watch state changes and update PiP elements
  watch(
    [
      () => focusStore.formattedTime,
      () => focusStore.activeTaskTitle,
      () => focusStore.isRunning,
      () => focusStore.mode
    ],
    () => {
      syncDisplay()
    }
  )

  async function togglePiP() {
    if (pipWindow.value) {
      pipWindow.value.close()
      pipWindow.value = null
      pipElements = null
      return
    }

    if (typeof window === 'undefined' || !('documentPictureInPicture' in window)) {
      console.warn('Document Picture-in-Picture API is not supported in this browser.')
      return
    }

    try {
      if (!window.documentPictureInPicture) return
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 310,
        height: 115
      })

      pipWindow.value = pipWin

      // Construct PiP DOM and bind action callbacks
      pipElements = createPiPDocumentLayout(pipWin, {
        onToggle: () => {
          if (focusStore.isRunning) {
            focusStore.pauseTimer()
          } else {
            focusStore.startTimer()
          }
        },
        onStop: () => {
          focusStore.stopTimer()
        },
        onDump: () => {
          window.focus()
          focusStore.isDistractionDumpOpen = true
        }
      })

      // Sync initial elements
      syncDisplay()

      // Active unthrottled interval inside the PiP window context
      const pipInterval = pipWin.setInterval(() => {
        focusStore.updateElapsedFromWallClock()
        syncDisplay()
      }, 500)

      pipWin.addEventListener('pagehide', () => {
        if (pipInterval) {
          pipWin.clearInterval(pipInterval)
        }
        pipWindow.value = null
        pipElements = null
      })
    } catch (err) {
      console.error('Failed to open Document Picture-in-Picture window:', err)
    }
  }

  return {
    pipWindow,
    isSupported,
    togglePiP
  }
}
