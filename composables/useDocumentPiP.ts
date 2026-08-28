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
      pipModeEl.textContent = focusStore.mode === 'work' ? 'Focus Anchor' : 'Resting Break'
    }
    if (pipDotEl) {
      const isWork = focusStore.mode === 'work'
      pipDotEl.style.backgroundColor = isWork ? '#22c55e' : '#38bdf8'
      pipDotEl.style.boxShadow = isWork ? '0 0 8px #22c55e' : '0 0 8px #38bdf8'
    }
    if (pipToggleBtn) {
      pipToggleBtn.textContent = focusStore.isRunning ? '⏸ Pause' : '▶ Start'
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
        width: 400,
        height: 210
      })

      pipWindow.value = pipWin

      // Setup window styles & Title
      pipWin.document.title = 'Focus Anchor'
      pipWin.document.body.style.margin = '0'
      pipWin.document.body.style.padding = '14px 16px'
      pipWin.document.body.style.backgroundColor = '#090d16'
      pipWin.document.body.style.color = '#f8fafc'
      pipWin.document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      pipWin.document.body.style.display = 'flex'
      pipWin.document.body.style.flexDirection = 'column'
      pipWin.document.body.style.justifyContent = 'space-between'
      pipWin.document.body.style.height = '100vh'
      pipWin.document.body.style.boxSizing = 'border-box'
      pipWin.document.body.style.userSelect = 'none'

      // Top Header row: Subtle badge on left + Timer on right
      const header = pipWin.document.createElement('div')
      header.style.display = 'flex'
      header.style.alignItems = 'center'
      header.style.justifyContent = 'space-between'

      const badgeContainer = pipWin.document.createElement('div')
      badgeContainer.style.display = 'flex'
      badgeContainer.style.alignItems = 'center'
      badgeContainer.style.gap = '6px'

      const dot = pipWin.document.createElement('span')
      dot.style.width = '8px'
      dot.style.height = '8px'
      dot.style.borderRadius = '50%'
      dot.style.backgroundColor = '#22c55e'
      dot.style.boxShadow = '0 0 8px #22c55e'
      badgeContainer.appendChild(dot)
      pipDotEl = dot

      const modeEl = pipWin.document.createElement('span')
      modeEl.style.fontSize = '11px'
      modeEl.style.fontWeight = '600'
      modeEl.style.color = '#94a3b8'
      modeEl.style.letterSpacing = '0.04em'
      badgeContainer.appendChild(modeEl)
      pipModeEl = modeEl

      header.appendChild(badgeContainer)

      const timeEl = pipWin.document.createElement('span')
      timeEl.style.fontSize = '20px'
      timeEl.style.fontWeight = '700'
      timeEl.style.fontFamily = 'ui-monospace, SFMono-Regular, monospace'
      timeEl.style.color = '#4ade80'
      header.appendChild(timeEl)
      pipTimeEl = timeEl

      pipWin.document.body.appendChild(header)

      // Ongoing Task Hero Card (Main Focus)
      const taskCard = pipWin.document.createElement('div')
      taskCard.style.backgroundColor = '#1e293b'
      taskCard.style.border = '1px solid #334155'
      taskCard.style.borderRadius = '10px'
      taskCard.style.padding = '10px 14px'
      taskCard.style.margin = '8px 0'
      taskCard.style.display = 'flex'
      taskCard.style.flexDirection = 'column'
      taskCard.style.gap = '4px'

      const taskLabel = pipWin.document.createElement('div')
      taskLabel.textContent = 'ONGOING TASK'
      taskLabel.style.fontSize = '10px'
      taskLabel.style.fontWeight = '700'
      taskLabel.style.color = '#4ade80'
      taskLabel.style.letterSpacing = '0.08em'
      taskCard.appendChild(taskLabel)

      const taskEl = pipWin.document.createElement('div')
      taskEl.style.fontSize = '18px'
      taskEl.style.fontWeight = '800'
      taskEl.style.color = '#ffffff'
      taskEl.style.lineHeight = '1.3'
      taskEl.style.wordBreak = 'break-word'
      taskEl.style.display = '-webkit-box'
      ;(taskEl.style as any).webkitLineClamp = '2'
      ;(taskEl.style as any).webkitBoxOrient = 'vertical'
      taskEl.style.overflow = 'hidden'
      taskEl.style.textOverflow = 'ellipsis'

      taskCard.appendChild(taskEl)
      pipWin.document.body.appendChild(taskCard)
      pipTaskEl = taskEl

      // Controls row
      const controls = pipWin.document.createElement('div')
      controls.style.display = 'flex'
      controls.style.alignItems = 'center'
      controls.style.gap = '8px'

      const toggleBtn = pipWin.document.createElement('button')
      toggleBtn.style.flex = '1'
      toggleBtn.style.backgroundColor = '#15803d'
      toggleBtn.style.color = '#ffffff'
      toggleBtn.style.border = '1px solid #22c55e'
      toggleBtn.style.borderRadius = '8px'
      toggleBtn.style.padding = '8px 12px'
      toggleBtn.style.fontSize = '13px'
      toggleBtn.style.fontWeight = '600'
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

      const dumpBtn = pipWin.document.createElement('button')
      dumpBtn.textContent = '+ Dump (Alt+D)'
      dumpBtn.style.backgroundColor = '#1e293b'
      dumpBtn.style.color = '#cbd5e1'
      dumpBtn.style.border = '1px solid #334155'
      dumpBtn.style.borderRadius = '8px'
      dumpBtn.style.padding = '8px 12px'
      dumpBtn.style.fontSize = '13px'
      dumpBtn.style.fontWeight = '600'
      dumpBtn.style.cursor = 'pointer'

      dumpBtn.onclick = () => {
        window.focus()
        focusStore.isDistractionDumpOpen = true
      }
      controls.appendChild(dumpBtn)

      pipWin.document.body.appendChild(controls)

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
