<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import { useToast } from '~/composables/useToast'
import type { QuadrantType, TaskItem } from '~/types/task'
import TaskContextMenu from '~/components/ui/TaskContextMenu.vue'

const taskStore = useTaskStore()
const { showToast } = useToast()
const inputText = ref('')
const isAnimating = ref(false)
const copiedTaskId = ref<string | null>(null)
let copyTimeout: ReturnType<typeof setTimeout> | null = null

const contextMenuShow = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const selectedTask = ref<TaskItem | null>(null)

const emit = defineEmits<{
  (e: 'next'): void
}>()

function onTaskContextMenu(event: MouseEvent, task: TaskItem) {
  event.preventDefault()
  event.stopPropagation()
  selectedTask.value = task
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuShow.value = true
}

function handleContextMove(targetQuadrant: QuadrantType) {
  if (selectedTask.value) {
    taskStore.moveTask(selectedTask.value.id, targetQuadrant)
  }
}

function handleContextDelete() {
  if (selectedTask.value) {
    taskStore.deleteTask(selectedTask.value.id)
  }
}

async function copyTaskText(text: string, taskId: string) {
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

    if (copyTimeout) clearTimeout(copyTimeout)
    copiedTaskId.value = taskId
    copyTimeout = setTimeout(() => {
      copiedTaskId.value = null
    }, 1500)

    showToast(`Tugas dicopy: ${text}`)
  } catch (err) {
    console.error('Failed to copy task text:', err)
    showToast(`Gagal menyalin tugas.`, 'error')
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    if (inputText.value.trim()) {
      taskStore.addTask(inputText.value, 'inbox')
      isAnimating.value = true
      setTimeout(() => {
        isAnimating.value = false
        inputText.value = ''
      }, 150)
    }
  }
}

function removeTask(id: string) {
  taskStore.deleteTask(id)
}
</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-120px)] justify-between">
    <!-- Header -->
    <header class="mb-8">
      <h2 class="text-display-lg font-bold text-on-surface mb-2">Rapid Input</h2>
      <p class="text-body-lg text-on-surface-variant max-w-2xl">
        Offload your working memory. Type a task and press Enter. Don't overthink, just capture to clear cognitive bandwidth.
      </p>
    </header>

    <!-- Main Input Box -->
    <div
      class="bg-surface-container-lowest rounded-xl border border-surface-variant p-8 mb-8 soft-shadow flex-1 flex flex-col relative transition-all duration-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:shadow-md"
      :class="{ 'scale-[0.99]': isAnimating }"
    >
      <div class="flex items-center gap-3 text-outline mb-4">
        <Icon name="material-symbols:keyboard" class="text-[28px]" />
        <span class="text-label-md uppercase tracking-wider text-outline-variant font-semibold">Awaiting Input</span>
      </div>

      <textarea
        v-model="inputText"
        @keydown="handleKeyDown"
        autofocus
        placeholder="What's on your mind?... (e.g. Prepare presentation, fix server bug)"
        class="w-full flex-1 bg-transparent border-none resize-none focus:ring-0 text-headline-lg font-semibold text-on-surface placeholder:text-surface-dim outline-none"
      />

      <div class="absolute bottom-6 right-6 flex items-center gap-2 text-label-sm text-outline-variant">
        <span>Press <kbd class="px-2 py-1 bg-surface-container-low rounded border border-surface-variant text-on-surface-variant font-mono text-xs">Enter</kbd> to add</span>
      </div>
    </div>

    <!-- Quick Capture Preview -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-headline-md font-semibold text-on-surface">Raw Inbox Preview</h3>
        <span class="text-label-md text-outline bg-surface-container-low px-3 py-1 rounded-full font-medium">
          {{ taskStore.rawInbox.length }} Items
        </span>
      </div>

      <div v-if="taskStore.rawInbox.length === 0" class="p-6 text-center border border-dashed border-surface-variant rounded-lg text-outline">
        No raw tasks yet. Type above and press Enter to capture thoughts instantaneously.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="task in taskStore.rawInbox"
          :key="task.id"
          @click="copyTaskText(task.title, task.id)"
          @contextmenu.prevent="onTaskContextMenu($event, task)"
          class="bg-surface-container-lowest border border-surface-variant rounded-lg p-4 flex items-start gap-3 hover:border-primary/30 transition-colors soft-shadow group/task relative cursor-pointer"
        >
          <!-- 0ms Custom Tooltip (Khusus Desktop) -->
          <div
            class="hidden md:block absolute left-0 bottom-[calc(100%+6px)] z-50 w-max max-w-xs sm:max-w-sm p-2.5 bg-slate-900/95 dark:bg-slate-800/95 text-slate-100 text-xs rounded-xl shadow-xl border border-slate-700/60 backdrop-blur-md opacity-0 pointer-events-none group-hover/task:opacity-100 transition-opacity duration-0 leading-snug break-words"
          >
            <div class="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-primary mb-0.5">
              <Icon name="material-symbols:info" class="text-[12px]" />
              <span>Detail Tugas</span>
            </div>
            <span>{{ task.title }}</span>
          </div>

          <div class="w-2.5 h-2.5 rounded-full bg-outline-variant mt-2 group-hover/task:bg-primary transition-colors shrink-0" />
          <p class="text-body-md text-on-surface flex-1 min-w-0 leading-snug flex items-center justify-between gap-2">
            <span class="truncate min-w-0 flex-1">{{ task.title }}</span>
            <span v-if="copiedTaskId === task.id" class="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0">
              <Icon name="material-symbols:check-circle" class="text-[14px]" /> Copied!
            </span>
          </p>
          <button
            @click.stop="removeTask(task.id)"
            class="text-outline hover:text-error opacity-0 group-hover/task:opacity-100 transition-opacity p-1 shrink-0"
            title="Delete task"
          >
            <Icon name="material-symbols:close" class="text-[18px]" />
          </button>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <div class="flex justify-end pt-4 border-t border-surface-variant">
      <button
        @click="emit('next')"
        class="bg-primary text-on-primary px-8 py-4 rounded-full text-label-md font-semibold flex items-center gap-3 hover:bg-primary-container hover:text-on-primary-container transition-all soft-shadow group"
      >
        <span>Next: Prioritize Matrix</span>
        <Icon name="material-symbols:arrow-forward" class="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>

    <!-- Right Click Context Menu -->
    <TaskContextMenu
      :show="contextMenuShow"
      :x="contextMenuX"
      :y="contextMenuY"
      :task="selectedTask"
      :allow-focus="false"
      @close="contextMenuShow = false"
      @move="handleContextMove"
      @delete="handleContextDelete"
    />
  </div>
</template>
