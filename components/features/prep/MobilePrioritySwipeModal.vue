<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import { useToast } from '~/composables/useToast'
import { useSwipeModal } from '~/composables/useSwipeModal'
import { useTaskDetailModal } from '~/composables/useTaskDetailModal'
import type { QuadrantType, TaskItem } from '~/types/task'
import AppModal from '~/components/ui/AppModal.vue'

const router = useRouter()
const taskStore = useTaskStore()
const { showToast } = useToast()
const { isSwipeModalOpen, closeSwipeModal } = useSwipeModal()
const { openTaskDetail } = useTaskDetailModal()

const quickInput = ref('')

function handleQuickAdd() {
  if (quickInput.value.trim()) {
    taskStore.addTask(quickInput.value.trim(), 'inbox')
    quickInput.value = ''
    showToast('Task baru ditambahkan ke Raw Inbox!')
  }
}

// Swipe pointer gesture state
const pointerId = ref<number | null>(null)
const startX = ref(0)
const startY = ref(0)
const currentX = ref(0)
const currentY = ref(0)
const isSwiping = ref(false)

const activeTask = computed<TaskItem | undefined>(() => taskStore.rawInbox[0])

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
  return Math.min(1, Math.max(0, currentX.value / 90))
})

const leftSwipeOpacity = computed(() => {
  return Math.min(1, Math.max(0, -currentX.value / 90))
})

function onPointerDown(e: PointerEvent) {
  if (!activeTask.value) return
  isSwiping.value = true
  pointerId.value = e.pointerId
  startX.value = e.clientX
  startY.value = e.clientY
  
  const el = e.currentTarget as HTMLElement | null
  if (el && typeof el.setPointerCapture === 'function') {
    try {
      el.setPointerCapture(e.pointerId)
    } catch (err) {
      // Fallback ignore
    }
  }
}

function onPointerMove(e: PointerEvent) {
  if (!isSwiping.value || e.pointerId !== pointerId.value) return
  currentX.value = e.clientX - startX.value
  currentY.value = e.clientY - startY.value
}

function onPointerUp(e: PointerEvent) {
  if (!isSwiping.value || e.pointerId !== pointerId.value) return
  isSwiping.value = false
  pointerId.value = null

  const el = e.currentTarget as HTMLElement | null
  if (el && typeof el.releasePointerCapture === 'function') {
    try {
      el.releasePointerCapture(e.pointerId)
    } catch (err) {
      // Fallback ignore
    }
  }

  const threshold = 80
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
  const taskTitle = activeTask.value.title
  currentX.value = 0
  currentY.value = 0
  taskStore.moveTask(taskId, quadrant)

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(40)
  }

  showToast(`Task "${taskTitle.substring(0, 20)}..." dipindahkan`)
}

function startFocus() {
  closeSwipeModal()
  router.push('/execute')
}

function handleCardClick() {
  if (activeTask.value && Math.abs(currentX.value) < 10) {
    openTaskDetail(activeTask.value)
  }
}
</script>

<template>
  <AppModal
    :isOpen="isSwipeModalOpen"
    title="⚡ Raw Inbox Swipe Priority"
    @close="closeSwipeModal"
  >
    <div class="flex flex-col items-center justify-between min-h-[480px] w-full max-w-sm mx-auto px-1 py-2">
      <!-- Instruction Subtitle -->
      <div class="text-center mb-4">
        <p class="text-xs text-on-surface-variant">
          Swipe <span class="font-bold text-error">Kanan</span> untuk Do First, <span class="font-bold text-amber-500">Kiri</span> untuk Delegate
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
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            :style="cardStyle"
            class="absolute inset-0 bg-surface-bright border-2 border-primary/30 shadow-xl rounded-2xl p-6 flex flex-col justify-between cursor-grab active:cursor-grabbing select-none overflow-hidden touch-none"
          >
            <!-- Swipe Direction Overlay: Right (Do First) -->
            <div
              :style="{ opacity: rightSwipeOpacity }"
              class="absolute inset-0 bg-error/15 border-4 border-error rounded-2xl flex items-center justify-start p-6 pointer-events-none transition-opacity z-10"
            >
              <span class="px-4 py-2 bg-error text-on-error rounded-xl font-bold text-lg shadow-md uppercase tracking-wider">
                Do First ⚡
              </span>
            </div>

            <!-- Swipe Direction Overlay: Left (Delegate) -->
            <div
              :style="{ opacity: leftSwipeOpacity }"
              class="absolute inset-0 bg-amber-500/15 border-4 border-amber-500 rounded-2xl flex items-center justify-end p-6 pointer-events-none transition-opacity z-10"
            >
              <span class="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-lg shadow-md uppercase tracking-wider">
                Delegate 👥
              </span>
            </div>

            <!-- Card Content -->
            <div>
              <div class="flex justify-between items-center mb-3">
                <span class="text-[11px] font-mono font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                  Raw Task #1 / {{ taskStore.rawInbox.length }}
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
              <span class="text-[11px] text-outline">Tap untuk detail & aksi</span>
              <button
                @click.stop="taskStore.deleteTask(activeTask.id)"
                class="text-error font-semibold hover:underline flex items-center gap-1 p-1"
              >
                <Icon name="material-symbols:delete" class="text-[16px]" /> Hapus
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
            <h3 class="text-base font-bold text-on-surface mb-1">Raw Inbox Bersih! 🎉</h3>
            <p class="text-xs text-on-surface-variant mb-3">
              Semua task raw inbox sudah diprioritaskan. Tambah task baru untuk swipe:
            </p>
          </div>

          <div class="w-full space-y-3">
            <div class="relative w-full">
              <input
                v-model="quickInput"
                @keydown.enter="handleQuickAdd"
                type="text"
                placeholder="Tambah task baru untuk diswipe..."
                class="w-full pl-3 pr-10 py-2.5 bg-surface-container-low border border-surface-variant rounded-xl text-xs text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright transition-all outline-none"
              />
              <button
                @click="handleQuickAdd"
                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-primary p-1 hover:bg-primary-container hover:text-on-primary-container rounded-lg transition-colors"
                title="Tambah task"
              >
                <Icon name="material-symbols:add-circle" class="text-[22px]" />
              </button>
            </div>

            <button
              @click="startFocus"
              class="w-full py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 text-xs"
            >
              <Icon name="material-symbols:bolt" class="text-[16px]" />
              Mulai Focus Mode
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
            class="py-3 px-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Icon name="material-symbols:arrow-back" class="text-[16px]" />
            <span>Delegate (Kiri)</span>
          </button>

          <!-- Swipe Right Button: Do First -->
          <button
            @click="assignQuadrant('do-first')"
            class="py-3 px-3 bg-error-container text-on-error-container border border-error/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <span>Do First (Kanan)</span>
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
  </AppModal>
</template>
