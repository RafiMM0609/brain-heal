import { useFocusStore } from '~/stores/useFocusStore'

export function useDocumentPiP() {
  const focusStore = useFocusStore()
  const pipWindow = ref<Window | null>(null)
  const isSupported = ref<boolean>(false)

  let pipTimeEl: HTMLElement | null = null
  let pipTaskEl: HTMLElement | null = null
  let pipModeEl: HTMLElement | null = null
  let pipDotEl: HTMLElement | null = null
  let pipToggleBtn: HTMLElement | null = null

  const PLAY_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
  const PAUSE_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
  const STOP_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>`
  const DUMP_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 21l3.54-.83A8.96 8.96 0 0 0 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/></svg>`

  onMounted(() => {
    isSupported.value = typeof window !== 'undefined' && 'documentPictureInPicture' in window
  })

  function updatePiPElements() {
    if (!pipWindow.value) return

    if (pipTimeEl) pipTimeEl.textContent = focusStore.formattedTime
    if (pipTaskEl) {
      const title = focusStore.activeTaskTitle || 'No active task selected'
      pipTaskEl.textContent = title
      pipTaskEl.title = title
    }
    if (pipModeEl) {
      pipModeEl.textContent = focusStore.mode === 'work' ? 'Focus' : 'Break'
    }
    if (pipDotEl) {
      const isWork = focusStore.mode === 'work'
      pipDotEl.style.backgroundColor = isWork ? '#22c55e' : '#38bdf8'
      pipDotEl.style.boxShadow = isWork ? '0 0 8px #22c55e' : '0 0 8px #38bdf8'
    }
    if (pipToggleBtn) {
      pipToggleBtn.innerHTML = focusStore.isRunning ? PAUSE_SVG : PLAY_SVG
      pipToggleBtn.title = focusStore.isRunning ? 'Pause Timer' : 'Start Timer'
      pipToggleBtn.style.backgroundColor = focusStore.isRunning ? '#15803d' : '#1e293b'
      pipToggleBtn.style.borderColor = focusStore.isRunning ? '#22c55e' : '#334155'
    }
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
      updatePiPElements()
    }
  )

  async function togglePiP() {
    if (pipWindow.value) {
      pipWindow.value.close()
      pipWindow.value = null
      return
    }

    if (typeof window === 'undefined' || !('documentPictureInPicture' in window)) {
      console.warn('Document Picture-in-Picture API is not supported in this browser.')
      return
    }

    try {
      const pipWin = await (window as any).documentPictureInPicture.requestWindow({
        width: 310,
        height: 115
      })

      pipWindow.value = pipWin

      // Setup window styles & Title
      pipWin.document.title = 'Focus Anchor'
      pipWin.document.body.style.margin = '0'
      pipWin.document.body.style.padding = '10px 12px'
      pipWin.document.body.style.backgroundColor = '#090d16'
      pipWin.document.body.style.color = '#f8fafc'
      pipWin.document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      pipWin.document.body.style.display = 'flex'
      pipWin.document.body.style.flexDirection = 'column'
      pipWin.document.body.style.justifyContent = 'space-between'
      pipWin.document.body.style.height = '100vh'
      pipWin.document.body.style.boxSizing = 'border-box'
      pipWin.document.body.style.userSelect = 'none'

      // Top Header row: Mode Dot + Task Title
      const header = pipWin.document.createElement('div')
      header.style.display = 'flex'
      header.style.alignItems = 'center'
      header.style.gap = '8px'
      header.style.overflow = 'hidden'

      const dot = pipWin.document.createElement('span')
      dot.style.width = '8px'
      dot.style.height = '8px'
      dot.style.borderRadius = '50%'
      dot.style.backgroundColor = '#22c55e'
      dot.style.boxShadow = '0 0 8px #22c55e'
      dot.style.flexShrink = '0'
      header.appendChild(dot)
      pipDotEl = dot

      const taskEl = pipWin.document.createElement('span')
      taskEl.style.fontSize = '12px'
      taskEl.style.fontWeight = '600'
      taskEl.style.color = '#cbd5e1'
      taskEl.style.whiteSpace = 'nowrap'
      taskEl.style.overflow = 'hidden'
      taskEl.style.textOverflow = 'ellipsis'
      taskEl.style.flex = '1'
      header.appendChild(taskEl)
      pipTaskEl = taskEl

      pipWin.document.body.appendChild(header)

      // Bottom Row: Monospace Timer + Icon Action Controls
      const bottomRow = pipWin.document.createElement('div')
      bottomRow.style.display = 'flex'
      bottomRow.style.alignItems = 'center'
      bottomRow.style.justifyContent = 'space-between'
      bottomRow.style.gap = '10px'

      // Timer Display
      const timeEl = pipWin.document.createElement('span')
      timeEl.style.fontSize = '26px'
      timeEl.style.fontWeight = '800'
      timeEl.style.fontFamily = 'ui-monospace, SFMono-Regular, monospace'
      timeEl.style.color = '#4ade80'
      timeEl.style.letterSpacing = '-0.02em'
      bottomRow.appendChild(timeEl)
      pipTimeEl = timeEl

      // Icon Controls Container
      const controls = pipWin.document.createElement('div')
      controls.style.display = 'flex'
      controls.style.alignItems = 'center'
      controls.style.gap = '6px'

      // Start / Pause Icon Button
      const toggleBtn = pipWin.document.createElement('button')
      toggleBtn.style.width = '36px'
      toggleBtn.style.height = '36px'
      toggleBtn.style.display = 'flex'
      toggleBtn.style.alignItems = 'center'
      toggleBtn.style.justifyContent = 'center'
      toggleBtn.style.backgroundColor = '#15803d'
      toggleBtn.style.color = '#ffffff'
      toggleBtn.style.border = '1px solid #22c55e'
      toggleBtn.style.borderRadius = '8px'
      toggleBtn.style.cursor = 'pointer'

      toggleBtn.onclick = () => {
        if (focusStore.isRunning) {
          focusStore.pauseTimer()
        } else {
          focusStore.startTimer()
        }
      }
      controls.appendChild(toggleBtn)
      pipToggleBtn = toggleBtn

      // Stop Icon Button
      const stopBtn = pipWin.document.createElement('button')
      stopBtn.innerHTML = STOP_SVG
      stopBtn.title = 'Stop Timer'
      stopBtn.style.width = '36px'
      stopBtn.style.height = '36px'
      stopBtn.style.display = 'flex'
      stopBtn.style.alignItems = 'center'
      stopBtn.style.justifyContent = 'center'
      stopBtn.style.backgroundColor = '#1e293b'
      stopBtn.style.color = '#ef4444'
      stopBtn.style.border = '1px solid #334155'
      stopBtn.style.borderRadius = '8px'
      stopBtn.style.cursor = 'pointer'

      stopBtn.onclick = () => {
        focusStore.stopTimer()
      }
      controls.appendChild(stopBtn)

      // Dump Thought Icon Button
      const dumpBtn = pipWin.document.createElement('button')
      dumpBtn.innerHTML = DUMP_SVG
      dumpBtn.title = 'Dump Thought (Alt+D)'
      dumpBtn.style.width = '36px'
      dumpBtn.style.height = '36px'
      dumpBtn.style.display = 'flex'
      dumpBtn.style.alignItems = 'center'
      dumpBtn.style.justifyContent = 'center'
      dumpBtn.style.backgroundColor = '#1e293b'
      dumpBtn.style.color = '#38bdf8'
      dumpBtn.style.border = '1px solid #334155'
      dumpBtn.style.borderRadius = '8px'
      dumpBtn.style.cursor = 'pointer'

      dumpBtn.onclick = () => {
        window.focus()
        focusStore.isDistractionDumpOpen = true
      }
      controls.appendChild(dumpBtn)

      bottomRow.appendChild(controls)
      pipWin.document.body.appendChild(bottomRow)

      // Sync initial elements
      updatePiPElements()

      // Active unthrottled interval inside the PiP window context
      const pipInterval = pipWin.setInterval(() => {
        focusStore.updateElapsedFromWallClock()
        updatePiPElements()
      }, 500)

      pipWin.addEventListener('pagehide', () => {
        if (pipInterval) {
          pipWin.clearInterval(pipInterval)
        }
        pipWindow.value = null
        pipTimeEl = null
        pipTaskEl = null
        pipModeEl = null
        pipDotEl = null
        pipToggleBtn = null
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

