/**
 * Document Picture-in-Picture Renderer
 * Helper for rendering imperative HTML/CSS and SVG icons inside secondary PiP windows.
 */

export interface PiPElements {
  timeEl: HTMLElement
  taskEl: HTMLElement
  modeEl: HTMLElement
  dotEl: HTMLElement
  toggleBtn: HTMLElement
}

export interface PiPDisplayState {
  formattedTime: string
  activeTaskTitle: string
  mode: string
  isRunning: boolean
}

export interface PiPActionCallbacks {
  onToggle: () => void
  onStop: () => void
  onDump: () => void
}

const PLAY_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
const PAUSE_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
const STOP_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>`
const DUMP_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 21l3.54-.83A8.96 8.96 0 0 0 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/></svg>`

export function createPiPDocumentLayout(
  pipWin: Window,
  callbacks: PiPActionCallbacks
): PiPElements {
  const doc = pipWin.document

  // Setup window styles & Title
  doc.title = 'Focus Anchor'
  doc.body.style.margin = '0'
  doc.body.style.padding = '10px 12px'
  doc.body.style.backgroundColor = '#090d16'
  doc.body.style.color = '#f8fafc'
  doc.body.style.fontFamily = 'system-ui, -apple-system, sans-serif'
  doc.body.style.display = 'flex'
  doc.body.style.flexDirection = 'column'
  doc.body.style.justifyContent = 'space-between'
  doc.body.style.height = '100vh'
  doc.body.style.boxSizing = 'border-box'
  doc.body.style.userSelect = 'none'

  // Top Header row: Mode Dot + Task Title
  const header = doc.createElement('div')
  header.style.display = 'flex'
  header.style.alignItems = 'center'
  header.style.gap = '8px'
  header.style.overflow = 'hidden'

  const dotEl = doc.createElement('span')
  dotEl.style.width = '8px'
  dotEl.style.height = '8px'
  dotEl.style.borderRadius = '50%'
  dotEl.style.backgroundColor = '#22c55e'
  dotEl.style.boxShadow = '0 0 8px #22c55e'
  dotEl.style.flexShrink = '0'
  header.appendChild(dotEl)

  const taskEl = doc.createElement('span')
  taskEl.style.fontSize = '12px'
  taskEl.style.fontWeight = '600'
  taskEl.style.color = '#cbd5e1'
  taskEl.style.whiteSpace = 'nowrap'
  taskEl.style.overflow = 'hidden'
  taskEl.style.textOverflow = 'ellipsis'
  taskEl.style.flex = '1'
  header.appendChild(taskEl)

  doc.body.appendChild(header)

  // Bottom Row: Monospace Timer + Icon Action Controls
  const bottomRow = doc.createElement('div')
  bottomRow.style.display = 'flex'
  bottomRow.style.alignItems = 'center'
  bottomRow.style.justifyContent = 'space-between'
  bottomRow.style.gap = '10px'

  // Timer Display
  const timeEl = doc.createElement('span')
  timeEl.style.fontSize = '26px'
  timeEl.style.fontWeight = '800'
  timeEl.style.fontFamily = 'ui-monospace, SFMono-Regular, monospace'
  timeEl.style.color = '#4ade80'
  timeEl.style.letterSpacing = '-0.02em'
  bottomRow.appendChild(timeEl)

  // Controls Container
  const controls = doc.createElement('div')
  controls.style.display = 'flex'
  controls.style.alignItems = 'center'
  controls.style.gap = '6px'

  // Start / Pause Icon Button
  const toggleBtn = doc.createElement('button')
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
  toggleBtn.onclick = callbacks.onToggle
  controls.appendChild(toggleBtn)

  // Stop Icon Button
  const stopBtn = doc.createElement('button')
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
  stopBtn.onclick = callbacks.onStop
  controls.appendChild(stopBtn)

  // Dump Thought Icon Button
  const dumpBtn = doc.createElement('button')
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
  dumpBtn.onclick = callbacks.onDump
  controls.appendChild(dumpBtn)

  bottomRow.appendChild(controls)
  doc.body.appendChild(bottomRow)

  // Create dummy modeEl for completeness or metadata
  const modeEl = doc.createElement('span')

  return {
    timeEl,
    taskEl,
    modeEl,
    dotEl,
    toggleBtn
  }
}

export function updatePiPDisplay(elements: PiPElements | null, state: PiPDisplayState): void {
  if (!elements) return

  elements.timeEl.textContent = state.formattedTime
  const title = state.activeTaskTitle || 'No active task selected'
  elements.taskEl.textContent = title
  elements.taskEl.title = title

  const isWork = state.mode === 'work'
  elements.dotEl.style.backgroundColor = isWork ? '#22c55e' : '#38bdf8'
  elements.dotEl.style.boxShadow = isWork ? '0 0 8px #22c55e' : '0 0 8px #38bdf8'

  elements.toggleBtn.innerHTML = state.isRunning ? PAUSE_SVG : PLAY_SVG
  elements.toggleBtn.title = state.isRunning ? 'Pause Timer' : 'Start Timer'
  elements.toggleBtn.style.backgroundColor = state.isRunning ? '#15803d' : '#1e293b'
  elements.toggleBtn.style.borderColor = state.isRunning ? '#22c55e' : '#334155'
}
