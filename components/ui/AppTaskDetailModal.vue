<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import { useFocusStore } from '~/stores/useFocusStore'
import { useTaskDetailModal } from '~/composables/useTaskDetailModal'
import type { QuadrantType } from '~/types/task'
import AppModal from '~/components/ui/AppModal.vue'

const router = useRouter()
const focusStore = useFocusStore()
const taskStore = useTaskStore()
const { isModalOpen, selectedTask, closeTaskDetail } = useTaskDetailModal()

function handleFocus() {
  if (!selectedTask.value) return
  focusStore.setFocusTask(selectedTask.value.id, selectedTask.value.title)
  closeTaskDetail()
  router.push('/execute')
}

function handleDelete() {
  if (!selectedTask.value) return
  taskStore.deleteTask(selectedTask.value.id)
  closeTaskDetail()
}

function getQuadrantLabel(quadrant: QuadrantType) {
  switch (quadrant) {
    case 'do-first': return 'Do First (Urgent & Important)'
    case 'schedule': return 'Schedule (Not Urgent & Important)'
    case 'delegate': return 'Delegate (Urgent & Low Impact)'
    case 'eliminate': return 'Eliminate (Low Urgency & Impact)'
    default: return 'Raw Inbox'
  }
}

function getQuadrantColorClass(quadrant: QuadrantType) {
  switch (quadrant) {
    case 'do-first': return 'bg-error/10 text-error border-error/30'
    case 'schedule': return 'bg-primary/10 text-primary border-primary/30'
    case 'delegate': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
    case 'eliminate': return 'bg-surface-container-high text-outline border-surface-variant'
    default: return 'bg-surface-container-high text-on-surface-variant border-surface-variant'
  }
}
</script>

<template>
  <AppModal
    :isOpen="isModalOpen"
    title="Detail Task"
    @close="closeTaskDetail"
  >
    <template #header>
      <button
        @click="handleDelete"
        class="ml-auto mr-1 text-xs font-bold text-error hover:bg-error/10 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95"
        title="Delete Task"
      >
        <Icon name="material-symbols:delete-outline" class="text-[18px]" />
        <span>Delete</span>
      </button>
    </template>
    <div v-if="selectedTask" class="space-y-6">
      <!-- Task Details Section -->
      <div class="space-y-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
            :class="getQuadrantColorClass(selectedTask.quadrant)"
          >
            {{ getQuadrantLabel(selectedTask.quadrant) }}
          </span>
          <span v-if="selectedTask.completed" class="text-[11px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
            Selesai ✓
          </span>
        </div>

        <h3 class="text-xl font-bold text-on-surface leading-snug break-words">
          {{ selectedTask.title }}
        </h3>

        <div v-if="selectedTask.focusTimeMinutes" class="text-xs text-on-surface-variant flex items-center gap-1.5 pt-1">
          <Icon name="material-symbols:timer" class="text-[16px] text-primary" />
          <span>Waktu Fokus: <strong>{{ selectedTask.focusTimeMinutes }} menit</strong></span>
        </div>
      </div>

      <!-- Action: Single Focus Mode Button -->
      <div class="pt-2">
        <button
          @click="handleFocus"
          class="w-full py-3.5 px-4 bg-primary hover:bg-primary-container text-on-primary font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99]"
        >
          <Icon name="material-symbols:bolt" class="text-[22px]" />
          <span>Mulai Focus Mode</span>
        </button>
      </div>
    </div>
  </AppModal>
</template>

