<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import { useFocusStore } from '~/stores/useFocusStore'
import { useToast } from '~/composables/useToast'
import { useTaskDetailModal } from '~/composables/useTaskDetailModal'
import type { QuadrantType } from '~/types/task'
import AppModal from '~/components/ui/AppModal.vue'

const router = useRouter()
const taskStore = useTaskStore()
const focusStore = useFocusStore()
const { showToast } = useToast()
const { isModalOpen, selectedTask, closeTaskDetail } = useTaskDetailModal()

const copied = ref(false)

async function copyText() {
  if (!selectedTask.value) return
  const text = selectedTask.value.title
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
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
    showToast(`Tugas dicopy: ${text}`)
  } catch (err) {
    console.warn('Clipboard write fallback error:', err)
  }
}

function handleMove(targetQuadrant: QuadrantType) {
  if (!selectedTask.value) return
  taskStore.moveTask(selectedTask.value.id, targetQuadrant)
  showToast(`Task dipindahkan ke ${getQuadrantLabel(targetQuadrant)}`)
  closeTaskDetail()
}

function handleFocus() {
  if (!selectedTask.value) return
  focusStore.setFocusTask(selectedTask.value.id, selectedTask.value.title)
  closeTaskDetail()
  router.push('/execute')
}

function handleComplete() {
  if (!selectedTask.value) return
  const taskId = selectedTask.value.id
  taskStore.toggleTaskComplete(taskId)
  showToast(`Task ditandai selesai! 🎉`)
  closeTaskDetail()
}

function handleDelete() {
  if (!selectedTask.value) return
  taskStore.deleteTask(selectedTask.value.id)
  showToast(`Task dihapus`)
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
    title="Detail & Action Task"
    @close="closeTaskDetail"
  >
    <div v-if="selectedTask" class="space-y-6">
      <!-- Task Header & Status Badge -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span
            class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
            :class="getQuadrantColorClass(selectedTask.quadrant)"
          >
            {{ getQuadrantLabel(selectedTask.quadrant) }}
          </span>
          <span v-if="selectedTask.completed" class="text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
            Selesai ✓
          </span>
        </div>

        <h3 class="text-xl font-bold text-on-surface leading-snug break-words">
          {{ selectedTask.title }}
        </h3>
      </div>

      <!-- Quick Action Buttons Grid -->
      <div class="space-y-3 pt-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-outline">Action Utama</h4>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Focus Mode Button -->
          <button
            @click="handleFocus"
            class="w-full py-3 px-4 bg-primary text-on-primary font-semibold text-sm rounded-xl hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Icon name="material-symbols:bolt" class="text-[20px]" />
            <span>Mulai Focus Mode</span>
          </button>

          <!-- Copy Text Button -->
          <button
            @click="copyText"
            class="w-full py-3 px-4 bg-surface-container-high hover:bg-surface-variant text-on-surface border border-surface-variant font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Icon :name="copied ? 'material-symbols:check-circle' : 'material-symbols:content-copy'" class="text-[20px] text-primary" />
            <span>{{ copied ? 'Tersalin!' : 'Copy Teks Task' }}</span>
          </button>
        </div>
      </div>

      <!-- Quadrant Reassignment Section -->
      <div class="space-y-3 pt-3 border-t border-surface-variant">
        <h4 class="text-xs font-bold uppercase tracking-wider text-outline">Pindahkan Kuadran (Eisenhower)</h4>
        
        <div class="grid grid-cols-2 gap-2 text-xs font-semibold">
          <button
            @click="handleMove('do-first')"
            class="p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all"
            :class="selectedTask.quadrant === 'do-first' ? 'bg-error text-on-error border-error' : 'bg-surface hover:bg-error/10 text-on-surface border-surface-variant'"
          >
            <span class="w-2 h-2 rounded-full bg-error shrink-0"></span>
            <span>Do First</span>
          </button>

          <button
            @click="handleMove('schedule')"
            class="p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all"
            :class="selectedTask.quadrant === 'schedule' ? 'bg-primary text-on-primary border-primary' : 'bg-surface hover:bg-primary/10 text-on-surface border-surface-variant'"
          >
            <span class="w-2 h-2 rounded-full bg-primary shrink-0"></span>
            <span>Schedule</span>
          </button>

          <button
            @click="handleMove('delegate')"
            class="p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all"
            :class="selectedTask.quadrant === 'delegate' ? 'bg-amber-500 text-white border-amber-500' : 'bg-surface hover:bg-amber-500/10 text-on-surface border-surface-variant'"
          >
            <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>Delegate</span>
          </button>

          <button
            @click="handleMove('eliminate')"
            class="p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all"
            :class="selectedTask.quadrant === 'eliminate' ? 'bg-outline text-white border-outline' : 'bg-surface hover:bg-surface-variant text-on-surface border-surface-variant'"
          >
            <span class="w-2 h-2 rounded-full bg-outline shrink-0"></span>
            <span>Eliminate</span>
          </button>

          <button
            @click="handleMove('inbox')"
            class="col-span-2 p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all bg-surface hover:bg-surface-variant text-on-surface-variant border-surface-variant"
          >
            <Icon name="material-symbols:inbox" class="text-[16px]" />
            <span>Kembalikan ke Raw Inbox</span>
          </button>
        </div>
      </div>

      <!-- Destructive & Completion Actions -->
      <div class="pt-4 border-t border-surface-variant flex items-center justify-between gap-3">
        <button
          @click="handleComplete"
          class="px-4 py-2 bg-success-container/30 hover:bg-success-container text-success font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Icon name="material-symbols:check-circle" class="text-[16px]" />
          <span>{{ selectedTask.completed ? 'Batal Selesai' : 'Tandai Selesai' }}</span>
        </button>

        <button
          @click="handleDelete"
          class="px-4 py-2 bg-error-container/30 hover:bg-error-container text-error font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Icon name="material-symbols:delete" class="text-[16px]" />
          <span>Hapus Task</span>
        </button>
      </div>
    </div>
  </AppModal>
</template>
