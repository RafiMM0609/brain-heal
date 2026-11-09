<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface Props {
  isOpen: boolean
  title?: string
  /** Set false for informational dialogs that must be dismissed explicitly. */
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  closeOnBackdrop: true
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const dialogRef = ref<HTMLElement | null>(null)

function handleClose() {
  emit('close')
}

/**
 * Drag-to-dismiss for the mobile bottom sheet.
 *
 * The handle at the top of the sheet was purely decorative before: it invited a
 * swipe that did nothing. Two phases, as any gesture needs:
 *
 *  - TRACK: the sheet's translateY maps 1:1 to the finger, written straight to
 *    the element (no transition, no reactive state per move).
 *  - RELEASE: distance OR velocity decides. A fast flick over a short distance
 *    dismisses; so does a slow drag past 40% of the sheet. Below the threshold
 *    it snaps back fast, because a slow snap-back reads as the UI disagreeing
 *    with you.
 *
 * Desktop is unaffected: the handle is `sm:hidden`, so the gesture only exists
 * on the sheet layout.
 */
const DISTANCE_RATIO = 0.4
const VELOCITY_THRESHOLD = 0.5
const SNAP_MS = 180
const EXIT_MS = 220
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

const drag = {
  active: false,
  pointerId: null as number | null,
  startY: 0,
  y: 0,
  lastY: 0,
  lastT: 0,
  velocity: 0
}

let sheetHeight = 0

function sheetEl(): HTMLElement | null {
  return dialogRef.value
}

function paintSheet(y: number, transition: string) {
  const el = sheetEl()
  if (!el) return
  el.style.transition = transition
  el.style.transform = y === 0 ? '' : `translateY(${y}px)`
}

function onSheetPointerDown(e: PointerEvent) {
  const el = sheetEl()
  if (!el) return

  // Only from the handle / header region, so content stays scrollable.
  const target = e.target as HTMLElement | null
  if (!target?.closest('[data-sheet-drag-handle]')) return

  drag.active = true
  drag.pointerId = e.pointerId
  drag.startY = e.clientY
  drag.y = 0
  drag.lastY = e.clientY
  drag.lastT = e.timeStamp
  drag.velocity = 0

  sheetHeight = el.offsetHeight || 400
  el.classList.add('gesture-tracking')

  try {
    el.setPointerCapture(e.pointerId)
  } catch {
    // Pointer capture is an optimisation; the drag still works without it.
  }
}

function onSheetPointerMove(e: PointerEvent) {
  if (!drag.active || e.pointerId !== drag.pointerId) return

  const dy = e.clientY - drag.startY
  const dt = e.timeStamp - drag.lastT
  if (dt > 0) drag.velocity = (e.clientY - drag.lastY) / dt
  drag.lastY = e.clientY
  drag.lastT = e.timeStamp

  // Downward only, damped past the sheet's own height: dragging up should not
  // lift a bottom sheet off the bottom of the screen.
  drag.y = dy >= 0 ? dy : dy * 0.2

  paintSheet(drag.y, 'none')
}

function onSheetPointerUp(e: PointerEvent) {
  if (!drag.active || e.pointerId !== drag.pointerId) return

  drag.active = false
  drag.pointerId = null

  const el = sheetEl()
  el?.classList.remove('gesture-tracking')
  try {
    el?.releasePointerCapture(e.pointerId)
  } catch {
    // Already released.
  }

  const passedDistance = drag.y > sheetHeight * DISTANCE_RATIO
  const flung = drag.velocity > VELOCITY_THRESHOLD && drag.y > 24

  if (passedDistance || flung) {
    /*
     * Continue the motion instead of handing over to the class-based leave
     * transition. The element still carries an inline `transition: none` from
     * the track phase, and an inline style outranks `.sheet-leave-*`, so
     * flipping `isOpen` here would make the sheet vanish instantly. Finishing
     * the exit inline and closing once it is off screen keeps the motion
     * continuous — the same rule the swipe card follows.
     */
    paintSheet(sheetHeight || 400, `transform ${EXIT_MS}ms ${EASE_OUT}`)
    emitCloseAfterExit()
    drag.y = 0
  } else {
    paintSheet(0, `transform ${SNAP_MS}ms ${EASE_OUT}`)
    drag.y = 0
  }
}

let closeTimer: ReturnType<typeof setTimeout> | null = null

function emitCloseAfterExit() {
  if (closeTimer !== null) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    closeTimer = null
    handleClose()
  }, EXIT_MS)
}

onUnmounted(() => {
  if (closeTimer !== null) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
})

function resetSheetTransform() {
  const el = sheetEl()
  if (!el) return
  el.classList.remove('gesture-tracking')
  el.style.transition = ''
  el.style.transform = ''
  drag.active = false
  drag.pointerId = null
  drag.y = 0
}

const keyboardHeight = ref(0)
const maxModalHeight = ref<string | undefined>(undefined)

function updateViewport() {
  if (typeof window === 'undefined' || !window.visualViewport) return

  const vv = window.visualViewport
  // Calculate soft keyboard height
  const kh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
  keyboardHeight.value = kh

  if (kh > 0) {
    // When keyboard is visible, constrain modal max-height to visual viewport height
    maxModalHeight.value = `${Math.max(180, vv.height - 16)}px`
  } else {
    maxModalHeight.value = undefined
  }
}

// --- Focus management ------------------------------------------------------
// Audit A-03: focus could leave the dialog on Tab, and the page behind the
// overlay still scrolled. Both are handled here so every modal inherits it.

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

let lastFocused: HTMLElement | null = null
let previousBodyOverflow = ''

function focusableElements(): HTMLElement[] {
  const root = dialogRef.value
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  )
}

function focusFirst() {
  const nodes = focusableElements()
  // Prefer an element the dialog explicitly marked as the initial target.
  const preferred = dialogRef.value?.querySelector<HTMLElement>('[data-autofocus]')
  const target = preferred || nodes[0] || dialogRef.value
  target?.focus?.({ preventScroll: true })
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return

  if (e.key === 'Escape') {
    handleClose()
    return
  }

  if (e.key !== 'Tab') return

  const nodes = focusableElements()
  if (nodes.length === 0) {
    e.preventDefault()
    return
  }

  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const active = document.activeElement as HTMLElement | null

  // Keep focus inside the dialog.
  if (!active || !dialogRef.value?.contains(active)) {
    e.preventDefault()
    first.focus()
    return
  }

  if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

function lockBodyScroll() {
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  document.body.style.overflow = previousBodyOverflow
}

const isClient = typeof window !== 'undefined'

onMounted(() => {
  if (!isClient) return
  window.addEventListener('keydown', handleKeydown)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewport)
    window.visualViewport.addEventListener('scroll', updateViewport)
    updateViewport()
  }
  if (props.isOpen) activateModal()
})

onUnmounted(() => {
  if (!isClient) return
  window.removeEventListener('keydown', handleKeydown)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', updateViewport)
    window.visualViewport.removeEventListener('scroll', updateViewport)
  }
  if (props.isOpen) {
    unlockBodyScroll()
    lastFocused?.focus?.({ preventScroll: true })
  }
})

function activateModal() {
  lastFocused = document.activeElement as HTMLElement | null
  lockBodyScroll()
  nextTick(() => {
    updateViewport()
    focusFirst()
  })
}

function deactivateModal() {
  unlockBodyScroll()
  lastFocused?.focus?.({ preventScroll: true })
  lastFocused = null
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) activateModal()
    else {
      deactivateModal()
      // The dragged offset must not survive into the next opening.
      nextTick(resetSheetTransform)
    }
  }
)
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="sheet">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-primary/40 dark:bg-black/60 backdrop-blur-sm transition-[padding] duration-150 ease-out"
          :style="{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined }"
          @click.self="closeOnBackdrop && handleClose()"
        >
          <div
            ref="dialogRef"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title ? 'modal-title' : undefined"
            tabindex="-1"
            @pointerdown="onSheetPointerDown"
            @pointermove="onSheetPointerMove"
            @pointerup="onSheetPointerUp"
            @pointercancel="onSheetPointerUp"
            class="bg-surface rounded-t-2xl sm:rounded-xl border border-surface-variant shadow-2xl max-w-lg w-full overflow-hidden flex flex-col transform transition-all pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pb-0 max-h-[90dvh] sm:max-h-[80dvh] outline-none"
            :style="{ maxHeight: maxModalHeight }"
          >
            <!-- Mobile Bottom Sheet Drag Handle -->
            <div
              data-sheet-drag-handle
              class="w-full pt-2 pb-1 flex items-center justify-center block sm:hidden shrink-0 touch-lock cursor-grab active:cursor-grabbing"
              aria-hidden="true"
            >
              <div class="w-12 h-1.5 bg-outline/30 rounded-full" />
            </div>

            <!-- Header -->
            <div
              v-if="title || $slots.header"
              data-sheet-drag-handle
              class="flex justify-between items-center gap-3 px-5 sm:px-6 py-3 sm:py-4 border-b border-surface-variant shrink-0"
            >
              <h3 v-if="title" id="modal-title" class="text-headline-md font-semibold text-primary">
                {{ title }}
              </h3>
              <slot name="header" />
              <button
                @click="handleClose"
                class="text-outline hover:text-primary transition-colors p-2 -mr-1 rounded-lg min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                aria-label="Close dialog"
              >
                <Icon name="material-symbols:close" class="text-[20px]" aria-hidden="true" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 pb-safe">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="px-5 sm:px-6 py-3 sm:py-4 bg-surface-container-low border-t border-surface-variant flex justify-end gap-3 shrink-0 pb-safe">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
/**
 * The open/close motion is a transition, never a keyframe: a gesture can grab
 * the sheet mid-flight and drag it back, and only a transition (or a spring)
 * survives being interrupted. The curve is the iOS sheet family — steep at the
 * start, gentle on the settle.
 */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s cubic-bezier(0.32, 0.72, 0, 1),
    transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

/* Leaving fast: the user just dismissed it, so don't make them wait. */
.sheet-leave-active {
  transition-duration: 0.2s;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .sheet-enter-from,
  .sheet-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
