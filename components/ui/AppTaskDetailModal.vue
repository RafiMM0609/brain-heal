<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import { useFocusStore } from '~/stores/useFocusStore'
import { useTaskDetailModal } from '~/composables/useTaskDetailModal'
import { useToast } from '~/composables/useToast'
import { copyTextToClipboard } from '~/utils/clipboard'
import type { QuadrantType } from '~/types/task'
import AppModal from '~/components/ui/AppModal.vue'

const router = useRouter()
const focusStore = useFocusStore()
const taskStore = useTaskStore()
const { showToast } = useToast()
const { isModalOpen, selectedTask, closeTaskDetail } = useTaskDetailModal()

function handleFocus() {
  if (!selectedTask.value) return
  focusStore.setFocusTask(selectedTask.value.id, selectedTask.value.title)
  closeTaskDetail()
  router.push('/execute')
}

function handleDelete() {
  if (!selectedTask.value) return
  const task = selectedTask.value
  closeTaskDetail()
  taskStore.deleteTask(task.id, { undoable: true })
}

async function handleCopy() {
  if (!selectedTask.value) return
  const ok = await copyTextToClipboard(selectedTask.value.title)
  showToast(ok ? 'Task copied to clipboard' : 'Could not copy to clipboard', ok ? 'success' : 'error')
}

function getQuadrantLabel(quadrant: QuadrantType) {
  switch (quadrant) {
    case 'do-first': return 'Do First · Urgent & Important'
    case 'schedule': return 'Schedule · Not Urgent & Important'
    case 'delegate': return 'Delegate · Urgent & Low Impact'
    case 'eliminate': return 'Eliminate · Low Urgency & Impact'
    default: return 'Raw Inbox'
  }
}

function getQuadrantColorClass(quadrant: QuadrantType) {
  switch (quadrant) {
    case 'do-first': return 'bg-error/10 text-error border-error/30'
    case 'schedule': return 'bg-primary/10 text-primary border-primary/30'
    case 'delegate': return 'bg-status-warn-surface text-status-warn border-status-warn/30'
    case 'eliminate': return 'bg-surface-container-high text-outline border-surface-variant'
    default: return 'bg-surface-container-high text-on-surface-variant border-surface-variant'
  }
}
</script>

<template>
  <AppModal
    :isOpen="isModalOpen"
    title="Task detail"
    @close="closeTaskDetail"
  >
    <template #header>
      <h3 id="modal-title" class="text-headline-md font-semibold text-primary truncate">
        Task detail
      </h3>
      <button
        @click="handleDelete"
        class="ml-auto mr-1 min-h-11 md:min-h-0 text-xs font-bold text-error hover:bg-error/10 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 active:scale-95"
      >
        <Icon name="material-symbols:delete-outline" class="text-[18px]" aria-hidden="true" />
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
          <span v-if="selectedTask.completed" class="text-[11px] font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full border border-secondary/20">
            Completed
          </span>
        </div>

        <h4 class="text-headline-md font-bold text-on-surface leading-snug break-words">
          {{ selectedTask.title }}
        </h4>

        <div v-if="selectedTask.focusTimeMinutes" class="text-xs text-on-surface-variant flex items-center gap-1.5 pt-1">
          <Icon name="material-symbols:timer" class="text-[16px] text-primary" aria-hidden="true" />
          <span>Focused time: <strong>{{ selectedTask.focusTimeMinutes }} min</strong></span>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-2 flex flex-col sm:flex-row gap-2">
        <button
          @click="handleFocus"
          class="flex-1 min-h-12 py-3.5 px-4 bg-primary hover:bg-primary-container text-on-primary font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99]"
        >
          <Icon name="material-symbols:bolt" class="text-[22px]" aria-hidden="true" />
          <span>Start focus session</span>
        </button>
        <button
          @click="handleCopy"
          class="min-h-12 px-4 py-3.5 bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-surface-variant active:scale-[0.99]"
        >
          <Icon name="material-symbols:content-copy" class="text-[20px]" aria-hidden="true" />
          <span>Copy</span>
        </button>
      </div>
    </div>
  </AppModal>
</template>
