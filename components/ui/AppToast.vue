<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toastState, hideToast } = useToast()
const toast = computed(() => toastState.value)

/**
 * Audit F-04: the toast ignored its `type` and always rendered a green
 * check-circle, so "Failed to share image" looked like a success. Icon and
 * accent colour now follow the toast type.
 */
const variant = computed(() => {
  switch (toast.value?.type) {
    case 'error':
      return {
        icon: 'material-symbols:error',
        iconClass: 'text-error',
        iconBg: 'bg-error/15',
        border: 'border-error/50'
      }
    case 'warning':
      return {
        icon: 'material-symbols:warning',
        iconClass: 'text-status-warn',
        iconBg: 'bg-status-warn-surface',
        border: 'border-status-warn/50'
      }
    case 'info':
      return {
        icon: 'material-symbols:info',
        iconClass: 'text-primary-fixed',
        iconBg: 'bg-primary/40',
        border: 'border-primary/50'
      }
    default:
      return {
        icon: 'material-symbols:check-circle',
        iconClass: 'text-secondary-fixed-dim',
        iconBg: 'bg-secondary/30',
        border: 'border-secondary/50'
      }
  }
})

async function runAction() {
  const action = toast.value?.action
  if (!action) return
  hideToast()
  await action.run()
}

/**
 * Swipe-to-dismiss.
 *
 * Spatial consistency: the toast slides in from the top, so it must be swiped
 * *up* to dismiss. Enter and exit share one axis, which is what makes the
 * gesture felt rather than learned.
 *
 * Track phase is 1:1 on the element's transform; release decides on distance OR
 * velocity, and a drag that falls short snaps back fast.
 */
const toastRef = ref<HTMLElement | null>(null)

const DISMISS_DISTANCE = 48
const VELOCITY_THRESHOLD = 0.4
const SNAP_MS = 160
const EXIT_MS = 180
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

let exitTimer: ReturnType<typeof setTimeout> | null = null

const swipe = {
  active: false,
  pointerId: null as number | null,
  startY: 0,
  y: 0,
  lastY: 0,
  lastT: 0,
  velocity: 0
}

function paintToast(y: number, transition: string) {
  const el = toastRef.value
  if (!el) return
  el.style.transition = transition
  // `translate(-50%, ...)` must carry the centring, or writing a transform here
  // would drop the `-translate-x-1/2` utility and the toast would jump right.
  el.style.transform = `translate3d(-50%, ${y}px, 0)`
  el.style.opacity = String(Math.max(0, 1 - Math.abs(y) / 120))
}

function resetToastTransform() {
  const el = toastRef.value
  if (!el) return
  el.classList.remove('gesture-tracking')
  el.style.transition = ''
  el.style.transform = ''
  el.style.opacity = ''
  swipe.active = false
  swipe.pointerId = null
  swipe.y = 0
}

watch(
  () => toast.value?.id,
  () => resetToastTransform()
)

function onToastPointerDown(e: PointerEvent) {
  const el = toastRef.value
  if (!el) return

  // A press on the action or close button is a tap, not a drag.
  const target = e.target as HTMLElement | null
  if (target?.closest('button, a, [role="button"]')) return

  swipe.active = true
  swipe.pointerId = e.pointerId
  swipe.startY = e.clientY
  swipe.y = 0
  swipe.lastY = e.clientY
  swipe.lastT = e.timeStamp
  swipe.velocity = 0

  el.classList.add('gesture-tracking')
}

function onToastPointerMove(e: PointerEvent) {
  if (!swipe.active || e.pointerId !== swipe.pointerId) return

  const dt = e.timeStamp - swipe.lastT
  if (dt > 0) swipe.velocity = (e.clientY - swipe.lastY) / dt
  swipe.lastY = e.clientY
  swipe.lastT = e.timeStamp

  swipe.y = e.clientY - swipe.startY
  paintToast(swipe.y, 'none')
}

function onToastPointerUp(e: PointerEvent) {
  if (!swipe.active || e.pointerId !== swipe.pointerId) return

  swipe.active = false
  swipe.pointerId = null
  toastRef.value?.classList.remove('gesture-tracking')

  // The toast entered from above, so only an upward drag dismisses it.
  const up = -swipe.y
  if (up > DISMISS_DISTANCE || -swipe.velocity > VELOCITY_THRESHOLD) {
    /*
     * Finish the exit inline, then hide. The element still has an inline
     * `transition` from the track phase, which outranks the class-based leave
     * transition — hiding immediately would make it disappear mid-flick.
     */
    paintToast(-140, `transform ${EXIT_MS}ms ${EASE_OUT}, opacity ${EXIT_MS}ms ease-out`)
    if (exitTimer !== null) clearTimeout(exitTimer)
    exitTimer = setTimeout(() => {
      exitTimer = null
      hideToast()
    }, EXIT_MS)
  } else {
    paintToast(0, `transform ${SNAP_MS}ms ${EASE_OUT}, opacity ${SNAP_MS}ms ease-out`)
  }
  swipe.y = 0
}

onUnmounted(() => {
  if (exitTimer !== null) {
    clearTimeout(exitTimer)
    exitTimer = null
  }
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-6 opacity-0 scale-95"
        enter-to-class="transform translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100 scale-100"
        leave-to-class="transform -translate-y-6 opacity-0 scale-95"
      >
        <div
          v-if="toast"
          ref="toastRef"
          @pointerdown="onToastPointerDown"
          @pointermove="onToastPointerMove"
          @pointerup="onToastPointerUp"
          @pointercancel="onToastPointerUp"
          class="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-[92vw] sm:max-w-lg w-auto px-4 sm:px-5 py-3 bg-slate-900/95 text-slate-100 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 gesture-surface touch-lock"
          :class="variant.border"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          aria-live="polite"
        >
          <div class="p-2 rounded-xl shrink-0 flex items-center justify-center" :class="[variant.iconBg, variant.iconClass]">
            <Icon :name="variant.icon" class="text-[22px]" aria-hidden="true" />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white leading-snug break-words">
              {{ toast.message }}
            </p>
          </div>

          <button
            v-if="toast.action"
            @click="runAction"
            class="shrink-0 inline-flex items-center gap-1.5 min-h-9 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            <Icon v-if="toast.action.icon" :name="toast.action.icon" class="text-[16px]" aria-hidden="true" />
            <span>{{ toast.action.label }}</span>
          </button>

          <button
            @click="hideToast"
            class="text-slate-400 hover:text-slate-200 rounded-lg transition-colors shrink-0 min-h-9 min-w-9 flex items-center justify-center"
            aria-label="Dismiss notification"
          >
            <Icon name="material-symbols:close" class="text-[18px]" aria-hidden="true" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
