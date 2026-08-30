<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import { useToast } from '~/composables/useToast'
import type { QuadrantType, TaskItem } from '~/types/task'

const taskStore = useTaskStore()
const { showToast } = useToast()
const router = useRouter()

// Swipe gesture state
const touchStartX = ref(0)
const touchStartY = ref(0)
const currentX = ref(0)
const currentY = ref(0)
const isSwiping = ref(false)

const activeTask = computed<TaskItem | undefined>(() => taskStore.rawInbox[0])

async function copyCardText(text: string) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }
    showToast(`Tugas dicopy: ${text}`)
  } catch (err) {
    console.error('Failed to copy card text:', err)
  }
}

const cardStyle = computed(() => {
  if (!isSwiping.value && currentX.value === 0) {
    return {
      transform: 'translate3d(0, 0, 0) rotate(0deg)',
      transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  }
  const rotation = currentX.value * 0.08
  return {
    transform: `translate3d(${currentX.value}px, ${currentY.value * 0.3}px, 0) rotate(${rotation}deg)`,
    transition: isSwiping.value ? 'none' : 'transform 0.3s ease-out'
  }
})

const rightSwipeOpacity = computed(() => {
  return Math.min(1, Math.max(0, currentX.value / 100))
})

const leftSwipeOpacity = computed(() => {
  return Math.min(1, Math.max(0, -currentX.value / 100))
})

function onTouchStart(e: TouchEvent) {
  if (!activeTask.value) return
  isSwiping.value = true
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

function onTouchMove(e: TouchEvent) {
  if (!isSwiping.value) return
  const diffX = e.touches[0].clientX - touchStartX.value
  const diffY = e.touches[0].clientY - touchStartY.value
  currentX.value = diffX
  currentY.value = diffY
}

function onTouchEnd() {
  if (!isSwiping.value) return
  isSwiping.value = false

  const threshold = 90
  if (currentX.value > threshold) {
    // Swipe Right -> Do First
    assignQuadrant('do-first')
  } else if (currentX.value < -threshold) {
    // Swipe Left -> Delegate
    assignQuadrant('delegate')
  } else {
    // Reset position
    currentX.value = 0
    currentY.value = 0
  }
}

function assignQuadrant(quadrant: QuadrantType) {
  if (!activeTask.value) return
  const taskId = activeTask.value.id
  currentX.value = 0
  currentY.value = 0
  taskStore.moveTask(taskId, quadrant)

  // Trigger brief vibration feedback
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(40)
  }
}

function startFocus() {
  router.push('/execute')
}
</script>

<template>
  <div class="flex flex-col items-center justify-between min-h-[520px] w-full max-w-sm mx-auto px-2 py-4">
    <!-- Header Badge -->
    <div class="text-center mb-4">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-1">
        <Icon name="material-symbols:swipe" class="text-[16px]" />
        Swipe Priority Mode
      </div>
      <p class="text-xs text-on-surface-variant">
        Swipe <span class="font-bold text-error">Right</span> for Do First, <span class="font-bold text-on-primary-container">Left</span> for Delegate
      </p>
    </div>

    <!-- Active Card Stack / Empty State -->
    <div class="relative w-full h-72 flex items-center justify-center">
      <div v-if="activeTask" class="relative w-full h-full">
        <!-- Background Stack Indicator (Layered effect) -->
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
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          :style="cardStyle"
          class="absolute inset-0 bg-surface-bright border-2 border-surface-variant shadow-xl rounded-2xl p-6 flex flex-col justify-between cursor-grab active:cursor-grabbing select-none overflow-hidden touch-none"
        >
          <!-- Swipe Direction Overlays -->
          <div
            :style="{ opacity: rightSwipeOpacity }"
            class="absolute inset-0 bg-error/15 border-4 border-error rounded-2xl flex items-center justify-start p-6 pointer-events-none transition-opacity"
          >
            <span class="px-4 py-2 bg-error text-on-error rounded-xl font-bold text-lg shadow-md uppercase tracking-wider">
              Do First ⚡
            </span>
          </div>

          <div
            :style="{ opacity: leftSwipeOpacity }"
            class="absolute inset-0 bg-on-primary-container/15 border-4 border-on-primary-container rounded-2xl flex items-center justify-end p-6 pointer-events-none transition-opacity"
          >
            <span class="px-4 py-2 bg-on-primary-container text-surface-bright rounded-xl font-bold text-lg shadow-md uppercase tracking-wider">
              Delegate 👥
            </span>
          </div>

          <!-- Card Content -->
          <div>
            <div class="flex justify-between items-center mb-3">
              <span class="text-[11px] font-mono font-bold text-outline uppercase bg-surface-container-high px-2 py-0.5 rounded">
                Raw Task #1 of {{ taskStore.rawInbox.length }}
              </span>
              <Icon name="material-symbols:drag-pan" class="text-outline text-[20px]" />
            </div>

            <h3 @click.stop="copyCardText(activeTask.title)" class="text-xl font-bold text-on-surface leading-snug break-words cursor-pointer hover:text-primary transition-colors">
              {{ activeTask.title }}
            </h3>
          </div>

          <div class="pt-4 border-t border-surface-variant/50 flex items-center justify-between text-xs text-outline">
            <span>Drag card or tap action buttons below</span>
            <button
              @click.stop="taskStore.deleteTask(activeTask.id)"
              class="text-error font-semibold hover:underline flex items-center gap-1 p-1"
            >
              <Icon name="material-symbols:delete" class="text-[16px]" /> Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Inbox Clear State -->
      <div v-else class="w-full h-full bg-surface-bright border-2 border-dashed border-primary/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
        <div class="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
          <Icon name="material-symbols:task-alt" class="text-[32px]" />
        </div>
        <h3 class="text-lg font-bold text-on-surface mb-1">Inbox Categorized!</h3>
        <p class="text-xs text-on-surface-variant mb-4">
          All raw thoughts have been moved to matrix quadrants. Ready to lock into execution?
        </p>
        <button
          @click="startFocus"
          class="w-full py-3 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Icon name="material-symbols:bolt" class="text-[18px]" />
          Enter Focus Mode
        </button>
      </div>
    </div>

    <!-- Touch Action Control Bar -->
    <div v-if="activeTask" class="w-full mt-6 space-y-2">
      <div class="grid grid-cols-2 gap-3">
        <!-- Swipe Left Button: Delegate -->
        <button
          @click="assignQuadrant('delegate')"
          class="py-3 px-3 bg-surface-container-high hover:bg-surface-container-highest border border-surface-variant text-on-surface rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Icon name="material-symbols:arrow-back" class="text-[16px] text-on-primary-container" />
          <span>Delegate (Left)</span>
        </button>

        <!-- Swipe Right Button: Do First -->
        <button
          @click="assignQuadrant('do-first')"
          class="py-3 px-3 bg-error-container text-on-error-container border border-error/30 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <span>Do First (Right)</span>
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
          class="py-2.5 px-3 bg-surface-container-low text-outline border border-surface-variant rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
        >
          <Icon name="material-symbols:block" class="text-[16px]" />
          <span>Eliminate</span>
        </button>
      </div>
    </div>
  </div>
</template>
