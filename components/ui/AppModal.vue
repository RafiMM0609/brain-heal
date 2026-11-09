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
    else deactivateModal()
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
            class="bg-surface rounded-t-2xl sm:rounded-xl border border-surface-variant shadow-2xl max-w-lg w-full overflow-hidden flex flex-col transform transition-all pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pb-0 max-h-[90vh] sm:max-h-[80vh] outline-none"
            :style="{ maxHeight: maxModalHeight }"
          >
            <!-- Mobile Bottom Sheet Drag Handle -->
            <div class="w-12 h-1.5 bg-outline/30 rounded-full mx-auto my-2 block sm:hidden shrink-0" aria-hidden="true" />

            <!-- Header -->
            <div v-if="title || $slots.header" class="flex justify-between items-center gap-3 px-5 sm:px-6 py-3 sm:py-4 border-b border-surface-variant shrink-0">
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
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
