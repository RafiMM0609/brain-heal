<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import { useToast } from '~/composables/useToast'
import { useSwipeModal } from '~/composables/useSwipeModal'
import { useTaskDetailModal } from '~/composables/useTaskDetailModal'
import { useTaskActions } from '~/composables/useTaskActions'
import type { QuadrantType, TaskItem } from '~/types/task'
import AppModal from '~/components/ui/AppModal.vue'

const router = useRouter()
const taskStore = useTaskStore()
const { showToast } = useToast()
const { isSwipeModalOpen, closeSwipeModal } = useSwipeModal()
const { openTaskDetail } = useTaskDetailModal()
const { deleteTaskWithUndo } = useTaskActions()

const quickInput = ref('')

function handleQuickAdd() {
  if (quickInput.value.trim()) {
    taskStore.addTask(quickInput.value.trim(), 'inbox')
    quickInput.value = ''
    showToast('Task added to Raw Inbox')
  }
}

/**
 * Swipe gesture.
 *
 * Two phases, and mixing them up is what makes a card feel wrong:
 *
 *  - TRACK (pointer down): position maps 1:1 to the finger. `transform` is
 *    written straight to the element, and the directional overlays read that
 *    same value, so nothing is eased and the component never re-renders per
 *    move event.
 *  - RELEASE (pointer up): physics finishes the motion. The card leaves in the
 *    direction it was thrown, and the move is only committed once it is off
 *    screen — committing first makes the new card appear mid-flight.
 */
const cardRef = ref<HTMLElement | null>(null)
const doFirstOverlayRef = ref<HTMLElement | null>(null)
const delegateOverlayRef = ref<HTMLElement | null>(null)

const activeTask = computed<TaskItem | undefined>(() => taskStore.rawInbox[0])

/**
 * Gesture state deliberately lives outside Vue's reactivity: a reactive write
 * on every `pointermove` re-renders the component and drops frames.
 */
const gesture = {
  active: false,
  pointerId: null as number | null,
  startX: 0,
  startY: 0,
  x: 0,
  y: 0,
  moved: false,
  lastX: 0,
  lastT: 0,
  velocity: 0 // px/ms, from the most recent sample
}

/** Resolved per drag so the threshold scales with the actual card on screen. */
let cardWidth = 320

/** Dismiss after ~32% of the card's travel... */
const DISTANCE_RATIO = 0.32
/** ...or on a fast flick over a short distance, otherwise flicks feel ignored. */
const VELOCITY_THRESHOLD = 0.5
const EXIT_MS = 220
const SNAP_MS = 180
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

let exitTimer: ReturnType<typeof setTimeout> | null = null

function clearExitTimer() {
  if (exitTimer !== null) {
    clearTimeout(exitTimer)
    exitTimer = null
  }
}

/**
 * Single source of truth for the card and both overlays. Deriving the overlay
 * opacity from the same `x` means the tint is always exactly as strong as the
 * card is far through its travel — including mid-gesture and when the finger
 * reverses.
 */
function paint(x: number, y: number, transition: string) {
  const el = cardRef.value
  if (!el) return

  el.style.transition = transition
  el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${x * 0.06}deg)`

  // Normalised against the dismiss threshold, so the overlay reaches full
  // strength exactly when letting go would commit the move.
  const travel = Math.max(1, cardWidth * DISTANCE_RATIO)
  const progress = Math.max(-1, Math.min(1, x / travel))

  if (doFirstOverlayRef.value) {
    doFirstOverlayRef.value.style.opacity = String(Math.max(0, progress))
  }
  if (delegateOverlayRef.value) {
    delegateOverlayRef.value.style.opacity = String(Math.max(0, -progress))
  }
}

function onPointerDown(e: PointerEvent) {
  if (!activeTask.value) return

  // A press that starts on a control inside the card is a tap, not a drag.
  const target = e.target as HTMLElement | null
  if (target?.closest('button, a, input, textarea, select, [role="button"]')) return

  const el = cardRef.value
  if (!el) return

  clearExitTimer()
  cardWidth = el.offsetWidth || 320

  gesture.active = true
  gesture.pointerId = e.pointerId
  gesture.startX = e.clientX
  gesture.startY = e.clientY
  gesture.x = 0
  gesture.y = 0
  gesture.moved = false
  gesture.lastX = e.clientX
  gesture.lastT = e.timeStamp
  gesture.velocity = 0

  // No transition while the finger owns the position.
  el.classList.add('gesture-tracking')

  try {
    el.setPointerCapture(e.pointerId)
  } catch {
    // Pointer capture is an optimisation; the drag still works without it.
  }
}

function onPointerMove(e: PointerEvent) {
  if (!gesture.active || e.pointerId !== gesture.pointerId) return

  const dx = e.clientX - gesture.startX
  const dy = e.clientY - gesture.startY

  if (!gesture.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
    gesture.moved = true
  }

  const dt = e.timeStamp - gesture.lastT
  if (dt > 0) gesture.velocity = (e.clientX - gesture.lastX) / dt
  gesture.lastX = e.clientX
  gesture.lastT = e.timeStamp

  gesture.x = dx
  // Vertical travel is damped: this is a horizontal decision, so the card
  // follows the finger with resistance instead of travelling 1:1.
  gesture.y = dy * 0.3

  paint(gesture.x, gesture.y, 'none')
}

function onPointerUp(e: PointerEvent) {
  if (!gesture.active || e.pointerId !== gesture.pointerId) return

  gesture.active = false
  gesture.pointerId = null

  const el = cardRef.value
  el?.classList.remove('gesture-tracking')

  try {
    el?.releasePointerCapture(e.pointerId)
  } catch {
    // Already released.
  }

  const committed = decide()
  if (committed) flyOut(committed)
  else snapBack()
}

/** Dismiss on distance OR velocity, in the direction the card was pushed. */
function decide(): QuadrantType | null {
  const { x, velocity } = gesture
  const distance = cardWidth * DISTANCE_RATIO

  if (x > 0 && (x > distance || velocity > VELOCITY_THRESHOLD)) return 'do-first'
  if (x < 0 && (x < -distance || velocity < -VELOCITY_THRESHOLD)) return 'delegate'
  return null
}

/** The card is thrown off screen, then the store updates behind it. */
function flyOut(quadrant: QuadrantType) {
  const direction = quadrant === 'do-first' ? 1 : -1
  const exitX = direction * (typeof window !== 'undefined' ? window.innerWidth : 420)

  paint(exitX, gesture.y, `transform ${EXIT_MS}ms ${EASE_OUT}`)

  clearExitTimer()
  exitTimer = setTimeout(() => {
    exitTimer = null
    commit(quadrant)
    reset()
  }, EXIT_MS)
}

/** Fast, not slow: a lingering snap-back reads as the UI arguing with you. */
function snapBack() {
  paint(0, 0, `transform ${SNAP_MS}ms ${EASE_OUT}`)

  gesture.x = 0
  gesture.y = 0
  gesture.velocity = 0
  gesture.moved = false
}

function reset() {
  clearExitTimer()
  gesture.active = false
  gesture.pointerId = null
  gesture.x = 0
  gesture.y = 0
  gesture.velocity = 0
  gesture.moved = false
  paint(0, 0, 'none')
}

function commit(quadrant: QuadrantType) {
  if (!activeTask.value) return

  const taskId = activeTask.value.id
  const taskTitle = activeTask.value.title
  taskStore.moveTask(taskId, quadrant)

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(40)
  }

  showToast(`Moved “${taskTitle.length > 24 ? taskTitle.slice(0, 24) + '…' : taskTitle}” to ${quadrantLabel(quadrant)}`)
}

/**
 * Button path. No force was applied, so there is no bounce and no fly-out —
 * the move commits immediately.
 */
function assignQuadrant(quadrant: QuadrantType) {
  commit(quadrant)
  reset()
}

const QUADRANT_LABELS: Record<QuadrantType, string> = {
  'do-first': 'Do First',
  'schedule': 'Schedule',
  'delegate': 'Delegate',
  'eliminate': 'Eliminate',
  inbox: 'Raw Inbox'
}

function quadrantLabel(quadrant: QuadrantType) {
  return QUADRANT_LABELS[quadrant] || 'Raw Inbox'
}

function removeActiveTask() {
  if (activeTask.value) deleteTaskWithUndo(activeTask.value.id)
}

function startFocus() {
  closeSwipeModal()
  router.push('/execute')
}

function handleCardClick() {
  // A swipe that happened to end near the origin is still a swipe, not a tap.
  if (gesture.moved) return
  if (activeTask.value) openTaskDetail(activeTask.value)
}

onUnmounted(clearExitTimer)
</script>

<template>
  <AppModal
    :isOpen="isSwipeModalOpen"
    title="Swipe priority"
    @close="closeSwipeModal"
  >
    <div class="flex flex-col items-center justify-between min-h-[480px] w-full max-w-sm mx-auto px-1 py-2">
      <!-- Instruction Subtitle -->
      <div class="text-center mb-4">
        <p class="text-xs text-on-surface-variant">
          Swipe <span class="font-bold text-error">right</span> for Do First, <span class="font-bold text-status-warn">left</span> for Delegate
        </p>
      </div>

      <!-- Active Card Stack / Empty State -->
      <div class="relative w-full h-72 flex items-center justify-center">
        <div v-if="activeTask" class="relative w-full h-full">
          <!-- Background Stack Layers -->
          <div
            v-if="taskStore.rawInbox.length > 1"
            class="absolute inset-0 bg-surface-bright border border-surface-variant rounded-2xl scale-[0.95] translate-y-3 shadow-sm opacity-60 pointer-events-none"
          />
          <div
            v-if="taskStore.rawInbox.length > 2"
            class="absolute inset-0 bg-surface-bright border border-surface-variant rounded-2xl scale-[0.90] translate-y-6 shadow-xs opacity-30 pointer-events-none"
          />

          <!-- Active Swipe Card -->
          <div
            ref="cardRef"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            class="absolute inset-0 bg-surface-bright border-2 border-primary/30 shadow-xl rounded-2xl p-6 flex flex-col justify-between cursor-grab active:cursor-grabbing gesture-surface touch-lock overflow-hidden"
          >
            <!-- Swipe Direction Overlay: Right (Do First) -->
            <div
              ref="doFirstOverlayRef"
              style="opacity: 0"
              class="absolute inset-0 bg-error/15 border-4 border-error rounded-2xl flex items-center justify-start p-6 pointer-events-none z-10"
            >
              <span class="px-4 py-2 bg-error text-on-error rounded-xl font-bold text-lg shadow-md uppercase tracking-wider">
                Do First
              </span>
            </div>

            <!-- Swipe Direction Overlay: Left (Delegate) -->
            <div
              ref="delegateOverlayRef"
              style="opacity: 0"
              class="absolute inset-0 bg-status-warn-surface border-4 border-status-warn rounded-2xl flex items-center justify-end p-6 pointer-events-none z-10"
            >
              <span class="px-4 py-2 bg-status-warn text-white rounded-xl font-bold text-lg shadow-md uppercase tracking-wider">
                Delegate
              </span>
            </div>

            <!-- Card Content -->
            <div>
              <div class="flex justify-between items-center mb-3">
                <span class="text-[11px] font-mono font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                  Task 1 of {{ taskStore.rawInbox.length }}
                </span>
                <Icon name="material-symbols:swipe" class="text-primary text-[20px]" />
              </div>

              <h3
                @click="handleCardClick"
                class="text-xl font-bold text-on-surface leading-snug break-words cursor-pointer hover:text-primary transition-colors"
              >
                {{ activeTask.title }}
              </h3>
            </div>

            <div class="pt-4 border-t border-surface-variant/50 flex items-center justify-between text-xs text-outline">
              <span class="text-[11px] text-on-surface-variant">Tap the title for details</span>
              <button
                @click.stop="removeActiveTask"
                class="text-error font-semibold hover:underline flex items-center gap-1 p-2 min-h-9 rounded-lg"
                :aria-label="`Delete ${activeTask.title}`"
              >
                <Icon name="material-symbols:delete" class="text-[16px]" aria-hidden="true" /> Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Empty Raw Inbox State -->
        <div v-else class="w-full h-full bg-surface-bright border-2 border-dashed border-primary/40 rounded-2xl p-5 flex flex-col items-center justify-between text-center shadow-sm min-h-[260px]">
          <div>
            <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 mx-auto">
              <Icon name="material-symbols:task-alt" class="text-[28px]" />
            </div>
            <h3 class="text-base font-bold text-on-surface mb-1">Raw Inbox is clear</h3>
            <p class="text-xs text-on-surface-variant mb-3">
              Every captured task has been sorted. Add a new one to keep swiping:
            </p>
          </div>

          <div class="w-full space-y-3">
            <div class="relative w-full">
              <input
                v-model="quickInput"
                @keydown.enter="handleQuickAdd"
                type="text"
                enterkeyhint="done"
                placeholder="Add a task to sort…"
                aria-label="New task title"
                class="w-full pl-3 pr-10 py-2.5 bg-surface-container-low border border-surface-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright transition-all outline-none"
              />
              <button
                @click="handleQuickAdd"
                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-primary p-1 hover:bg-primary-container hover:text-on-primary-container rounded-lg transition-colors"
                aria-label="Add task"
              >
                <Icon name="material-symbols:add-circle" class="text-[22px]" />
              </button>
            </div>

            <button
              @click="startFocus"
              class="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 text-xs"
            >
              <Icon name="material-symbols:bolt" class="text-[16px]" aria-hidden="true" />
              Start focus session
            </button>
          </div>
        </div>
      </div>

      <!-- Action Buttons Bar -->
      <div v-if="activeTask" class="w-full mt-6 space-y-2">
        <div class="grid grid-cols-2 gap-3">
          <!-- Swipe Left Button: Delegate -->
          <button
            @click="assignQuadrant('delegate')"
            class="min-h-11 py-3 px-3 bg-status-warn-surface text-status-warn border border-status-warn/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Icon name="material-symbols:arrow-back" class="text-[16px]" />
            <span>Delegate</span>
          </button>

          <!-- Swipe Right Button: Do First -->
          <button
            @click="assignQuadrant('do-first')"
            class="min-h-11 py-3 px-3 bg-error-container text-on-error-container border border-error/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <span>Do First</span>
            <Icon name="material-symbols:arrow-forward" class="text-[16px]" />
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Tap Button: Schedule -->
          <button
            @click="assignQuadrant('schedule')"
            class="py-2.5 px-3 bg-primary/10 text-primary border border-primary/20 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Icon name="material-symbols:calendar-today" class="text-[16px]" />
            <span>Schedule</span>
          </button>

          <!-- Tap Button: Eliminate -->
          <button
            @click="assignQuadrant('eliminate')"
            class="py-2.5 px-3 min-h-11 bg-surface-container-low text-on-surface-variant border border-surface-variant rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Icon name="material-symbols:block" class="text-[16px]" />
            <span>Eliminate</span>
          </button>
        </div>
      </div>
    </div>
  </AppModal>
</template>
