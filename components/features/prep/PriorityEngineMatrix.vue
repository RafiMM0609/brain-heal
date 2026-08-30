<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import { useToast } from '~/composables/useToast'
import { useSwipeModal } from '~/composables/useSwipeModal'
import { useTaskDetailModal } from '~/composables/useTaskDetailModal'
import type { QuadrantType, TaskItem } from '~/types/task'
import AppTooltip from '~/components/ui/AppTooltip.vue'

const taskStore = useTaskStore()
const { showToast } = useToast()
const { openSwipeModal } = useSwipeModal()
const { openTaskDetail } = useTaskDetailModal()

const quickAddInput = ref('')
const draggedTaskId = ref<string | null>(null)
const activeDragOverQuadrant = ref<QuadrantType | null>(null)
const justDraggedTimestamp = ref(0)
const isTouchDevice = ref(false)

onMounted(() => {
  if (typeof window !== 'undefined') {
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
})

const router = useRouter()
const copiedTaskId = ref<string | null>(null)
let copyTimeout: ReturnType<typeof setTimeout> | null = null

function handleTaskClick(task: TaskItem) {
  if (Date.now() - justDraggedTimestamp.value < 300) {
    return
  }
  copyTaskText(task.title, task.id)
  openTaskDetail(task)
}

async function copyTaskText(text: string, taskId: string) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback for non-secure contexts or unsupported Clipboard API
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
  } catch (err) {
    console.warn('Clipboard write fallback:', err)
  }

  if (copyTimeout) clearTimeout(copyTimeout)
  copiedTaskId.value = taskId
  copyTimeout = setTimeout(() => {
    copiedTaskId.value = null
  }, 1500)

  showToast('📋 Copied!')
}

// Drag and drop handlers
function onDragStart(event: DragEvent, taskId: string) {
  draggedTaskId.value = taskId
  justDraggedTimestamp.value = Date.now()
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', taskId)
  }
}

function onDragEnd() {
  draggedTaskId.value = null
  activeDragOverQuadrant.value = null
  justDraggedTimestamp.value = Date.now()
}

function onDragOver(event: DragEvent, targetQuadrant: QuadrantType) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  activeDragOverQuadrant.value = targetQuadrant
}

function onDragLeave(targetQuadrant: QuadrantType) {
  if (activeDragOverQuadrant.value === targetQuadrant) {
    activeDragOverQuadrant.value = null
  }
}

function onDrop(event: DragEvent, targetQuadrant: QuadrantType) {
  event.preventDefault()
  const taskId = draggedTaskId.value || event.dataTransfer?.getData('text/plain')
  if (taskId) {
    taskStore.moveTask(taskId, targetQuadrant)
  }
  draggedTaskId.value = null
  activeDragOverQuadrant.value = null
  justDraggedTimestamp.value = Date.now()
}

function handleQuickAdd() {
  if (quickAddInput.value.trim()) {
    taskStore.addTask(quickAddInput.value, 'inbox')
    quickAddInput.value = ''
  }
}

function startFocusOnTask(task: TaskItem) {
  const focusStore = useFocusStore()
  focusStore.setFocusTask(task.id, task.title)
  router.push('/execute')
}

import TaskContextMenu from '~/components/ui/TaskContextMenu.vue'

// Context menu state
const contextMenuShow = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const selectedTask = ref<TaskItem | null>(null)

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

function handleContextFocus() {
  if (selectedTask.value) {
    startFocusOnTask(selectedTask.value)
  }
}

function handleContextDelete() {
  if (selectedTask.value) {
    taskStore.deleteTask(selectedTask.value.id)
  }
}

function handleContextDetail() {
  if (selectedTask.value) {
    openTaskDetail(selectedTask.value)
  }
}

function handleContextComplete() {
  if (selectedTask.value) {
    const focusStore = useFocusStore()
    focusStore.openMentalClosure({
      id: selectedTask.value.id,
      title: selectedTask.value.title
    })
  }
}
</script>

<template>
  <div class="flex flex-col h-full max-w-full mx-auto w-full min-w-0">
    <!-- Title & Neuroscience Header -->
    <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <h2 class="text-display-lg font-bold text-primary mb-2">Priority Engine</h2>
        <p class="text-body-lg text-on-surface-variant max-w-2xl">
          Reduce decision fatigue by categorizing tasks. The Eisenhower Matrix bypasses the amygdala's stress response, engaging the prefrontal cortex for deliberate execution.
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <button
          v-if="taskStore.tasks.length > 0"
          @click="taskStore.clearAllTasks()"
          class="px-3 py-1.5 bg-error-container/40 hover:bg-error-container text-error rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-error/20"
          title="Clear all tasks from Upstash & UI"
        >
          <Icon name="material-symbols:delete-sweep" class="text-[16px]" />
          <span>Clear All</span>
        </button>
        <AppTooltip title="Neuroscience Note:" align="right">
          Categorizing tasks into rigid structural buckets reduces the cognitive load required to hold them in working memory. This lowers cortisol and protects focus.
        </AppTooltip>
      </div>
    </div>

    <!-- Layout Grid: Raw Inbox + 4 Quadrants -->
    <div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px] min-w-0 w-full">
      <!-- Raw Inbox Column -->
      <div
        class="w-full lg:w-1/4 bg-surface-bright border border-surface-variant rounded-xl p-4 flex flex-col shadow-sm min-w-0"
        :class="{ 'drag-over': activeDragOverQuadrant === 'inbox' }"
        @dragover="onDragOver($event, 'inbox')"
        @dragleave="onDragLeave('inbox')"
        @drop="onDrop($event, 'inbox')"
      >
        <div class="flex justify-between items-center mb-4 pb-2 border-b border-surface-variant">
          <h3 class="text-headline-md font-semibold text-on-surface">Raw Inbox</h3>
          <div class="flex items-center gap-2">
            <button
              v-if="taskStore.rawInbox.length > 0"
              @click="openSwipeModal()"
              class="px-2.5 py-1 bg-primary text-on-primary font-bold rounded-lg text-xs flex items-center gap-1.5 hover:bg-primary-container shadow-xs transition-all"
              title="Buka Swipe Priority Mode"
            >
              <Icon name="material-symbols:swipe" class="text-[16px]" />
              <span>Swipe Mode</span>
            </button>
            <Icon name="material-symbols:inbox" class="text-outline text-[24px]" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[150px]">
          <div
            v-for="task in taskStore.rawInbox"
            :key="task.id"
            :draggable="!isTouchDevice ? 'true' : false"
            @dragstart="onDragStart($event, task.id)"
            @dragend="onDragEnd"
            @contextmenu.prevent="onTaskContextMenu($event, task)"
            @click="handleTaskClick(task)"
            class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 hover:border-primary/50 hover:bg-surface-container-low hover:shadow-md hover:-translate-y-0.5 group cursor-pointer active:scale-[0.98] transition-all duration-200"
            :class="{ 'dragging': draggedTaskId === task.id }"
          >
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <Icon name="material-symbols:drag-indicator" class="text-outline-variant text-[20px] cursor-grab hover:text-primary active:cursor-grabbing shrink-0 hidden sm:block" />
              <span
                class="text-body-md text-on-surface transition-all duration-150 flex-1 min-w-0 flex items-center gap-1.5"
              >
                <span class="line-clamp-3 break-words min-w-0 flex-1 leading-snug">{{ task.title }}</span>
                <span v-if="copiedTaskId === task.id" class="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0 animate-pulse">
                  <Icon name="material-symbols:check-circle" class="text-[14px]" /> Copied!
                </span>
              </span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click.stop="startFocusOnTask(task)"
                class="px-2 py-1 bg-primary text-on-primary rounded text-xs hover:bg-primary-container transition-colors flex items-center gap-1"
              >
                <Icon name="material-symbols:bolt" class="text-[14px]" /> Focus
              </button>
              <button
                @click.stop="taskStore.deleteTask(task.id)"
                class="text-outline hover:text-error p-1 rounded transition-colors shrink-0"
                title="Delete task"
              >
                <Icon name="material-symbols:delete" class="text-[18px]" />
              </button>
            </div>
          </div>

          <div v-if="taskStore.rawInbox.length === 0" class="text-center text-outline text-sm py-8 border border-dashed border-surface-variant rounded-lg">
            Inbox clear. Drag items back here if needed.
          </div>
        </div>

        <!-- Quick Add Field -->
        <div class="mt-4 pt-4 border-t border-surface-variant">
          <div class="relative">
            <input
              v-model="quickAddInput"
              @keydown.enter="handleQuickAdd"
              type="text"
              placeholder="Quick add task..."
              class="w-full pl-3 pr-10 py-2 bg-surface-container-low border-none rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright transition-all"
            />
            <button
              @click="handleQuickAdd"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-primary p-1 hover:bg-primary-container hover:text-on-primary-container rounded-md transition-colors"
            >
              <Icon name="material-symbols:add" class="text-[20px]" />
            </button>
          </div>
        </div>
      </div>

      <!-- Matrix 2x2 Grid -->
      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative min-w-0 w-full">
        <!-- Quadrant 1: Do First -->
        <div
          class="matrix-quadrant bg-surface-bright rounded-xl border border-surface-variant p-4 flex flex-col relative overflow-hidden shadow-sm"
          :class="{ 'drag-over': activeDragOverQuadrant === 'do-first' }"
          @dragover="onDragOver($event, 'do-first')"
          @dragleave="onDragLeave('do-first')"
          @drop="onDrop($event, 'do-first')"
        >
          <div class="absolute top-0 left-0 w-full h-1 bg-error"></div>
          <div class="flex justify-between items-center mb-3">
            <div>
              <h3 class="text-headline-md font-semibold text-on-surface flex items-center gap-2">
                Do First
                <AppTooltip title="Do First (Urgent & Important)" align="left">
                  Crises, deadlines, and core problems. High urgency and high impact.
                </AppTooltip>
              </h3>
              <p class="text-label-sm text-on-surface-variant">High Urgency / High Impact</p>
            </div>
            <span class="text-xs font-semibold px-2 py-1 bg-error-container text-on-error-container rounded-full">
              {{ taskStore.doFirstTasks.length }}
            </span>
          </div>

          <div class="flex-1 bg-surface-container-low rounded-lg p-3 space-y-2 min-h-[140px] border-2 border-dashed border-transparent transition-colors overflow-y-auto">
            <div
              v-for="task in taskStore.doFirstTasks"
              :key="task.id"
              :draggable="!isTouchDevice ? 'true' : false"
              @dragstart="onDragStart($event, task.id)"
              @dragend="onDragEnd"
              @contextmenu.prevent="onTaskContextMenu($event, task)"
              @click="handleTaskClick(task)"
              class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 hover:border-error/60 hover:bg-error-container/10 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer active:scale-[0.98] transition-all duration-200"
              :class="{ 'dragging': draggedTaskId === task.id }"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Icon name="material-symbols:drag-indicator" class="text-outline-variant text-[20px] cursor-grab hover:text-error active:cursor-grabbing shrink-0 hidden sm:block" />
                <span
                  class="text-body-md text-on-surface font-medium transition-all duration-150 flex-1 min-w-0 flex items-center gap-1.5"
                >
                  <span class="line-clamp-3 break-words min-w-0 flex-1 leading-snug">{{ task.title }}</span>
                  <span v-if="copiedTaskId === task.id" class="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0 animate-pulse">
                    <Icon name="material-symbols:check-circle" class="text-[14px]" /> Copied!
                  </span>
                </span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click.stop="startFocusOnTask(task)"
                  class="px-2 py-1 bg-primary text-on-primary rounded text-xs hover:bg-primary-container transition-colors flex items-center gap-1"
                >
                  <Icon name="material-symbols:bolt" class="text-[14px]" /> Focus
                </button>
                <button
                  @click.stop="taskStore.deleteTask(task.id)"
                  class="text-outline hover:text-error p-1 rounded transition-colors"
                  title="Delete task"
                >
                  <Icon name="material-symbols:delete" class="text-[18px]" />
                </button>
              </div>
            </div>
            <div v-if="taskStore.doFirstTasks.length === 0" class="text-center text-outline text-xs py-6">
              Drop high urgency/high impact tasks here
            </div>
          </div>
        </div>

        <!-- Quadrant 2: Schedule -->
        <div
          class="matrix-quadrant bg-surface-bright rounded-xl border border-surface-variant p-4 flex flex-col relative overflow-hidden shadow-sm min-w-0"
          :class="{ 'drag-over': activeDragOverQuadrant === 'schedule' }"
          @dragover="onDragOver($event, 'schedule')"
          @dragleave="onDragLeave('schedule')"
          @drop="onDrop($event, 'schedule')"
        >
          <div class="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <div class="flex justify-between items-center mb-3">
            <div>
              <h3 class="text-headline-md font-semibold text-on-surface flex items-center gap-2">
                Schedule
                <AppTooltip title="Schedule (Not Urgent & Important)" align="left">
                  Deep work, strategic planning, skill development. Zone of peak cognitive flow.
                </AppTooltip>
              </h3>
              <p class="text-label-sm text-on-surface-variant">Low Urgency / High Impact</p>
            </div>
            <span class="text-xs font-semibold px-2 py-1 bg-primary-fixed text-on-primary-fixed rounded-full">
              {{ taskStore.scheduleTasks.length }}
            </span>
          </div>

          <div class="flex-1 bg-surface-container-low rounded-lg p-3 space-y-2 min-h-[140px] border-2 border-dashed border-transparent transition-colors overflow-y-auto">
            <div
              v-for="task in taskStore.scheduleTasks"
              :key="task.id"
              :draggable="!isTouchDevice ? 'true' : false"
              @dragstart="onDragStart($event, task.id)"
              @dragend="onDragEnd"
              @contextmenu.prevent="onTaskContextMenu($event, task)"
              @click="handleTaskClick(task)"
              class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 hover:border-primary/60 hover:bg-primary-container/10 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer active:scale-[0.98] transition-all duration-200"
              :class="{ 'dragging': draggedTaskId === task.id }"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Icon name="material-symbols:drag-indicator" class="text-outline-variant text-[20px] cursor-grab hover:text-primary active:cursor-grabbing shrink-0 hidden sm:block" />
                <span
                  class="text-body-md text-on-surface font-medium transition-all duration-150 flex-1 min-w-0 flex items-center gap-1.5"
                >
                  <span class="line-clamp-3 break-words min-w-0 flex-1 leading-snug">{{ task.title }}</span>
                  <span v-if="copiedTaskId === task.id" class="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0 animate-pulse">
                    <Icon name="material-symbols:check-circle" class="text-[14px]" /> Copied!
                  </span>
                </span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click.stop="startFocusOnTask(task)"
                  class="px-2 py-1 bg-primary text-on-primary rounded text-xs hover:bg-primary-container transition-colors flex items-center gap-1"
                >
                  <Icon name="material-symbols:bolt" class="text-[14px]" /> Focus
                </button>
                <button
                  @click.stop="taskStore.deleteTask(task.id)"
                  class="text-outline hover:text-error p-1 rounded transition-colors"
                  title="Delete task"
                >
                  <Icon name="material-symbols:delete" class="text-[18px]" />
                </button>
              </div>
            </div>
            <div v-if="taskStore.scheduleTasks.length === 0" class="text-center text-outline text-xs py-6">
              Drop deep work tasks to schedule here
            </div>
          </div>
        </div>

        <!-- Quadrant 3: Delegate -->
        <div
          class="matrix-quadrant bg-surface-bright rounded-xl border border-surface-variant p-4 flex flex-col relative overflow-hidden shadow-sm min-w-0"
          :class="{ 'drag-over': activeDragOverQuadrant === 'delegate' }"
          @dragover="onDragOver($event, 'delegate')"
          @dragleave="onDragLeave('delegate')"
          @drop="onDrop($event, 'delegate')"
        >
          <div class="absolute top-0 left-0 w-full h-1 bg-on-primary-container"></div>
          <div class="flex justify-between items-center mb-3">
            <div>
              <h3 class="text-headline-md font-semibold text-on-surface flex items-center gap-2">
                Delegate
                <AppTooltip title="Delegate (Urgent & Low Impact)" align="left">
                  Interruptions, minor administrative tasks. Creates false sense of urgency.
                </AppTooltip>
              </h3>
              <p class="text-label-sm text-on-surface-variant">High Urgency / Low Impact</p>
            </div>
            <span class="text-xs font-semibold px-2 py-1 bg-surface-container-high text-on-surface-variant rounded-full">
              {{ taskStore.delegateTasks.length }}
            </span>
          </div>

          <div class="flex-1 bg-surface-container-low rounded-lg p-3 space-y-2 min-h-[140px] border-2 border-dashed border-transparent transition-colors overflow-y-auto">
            <div
              v-for="task in taskStore.delegateTasks"
              :key="task.id"
              :draggable="!isTouchDevice ? 'true' : false"
              @dragstart="onDragStart($event, task.id)"
              @dragend="onDragEnd"
              @contextmenu.prevent="onTaskContextMenu($event, task)"
              @click="handleTaskClick(task)"
              class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 hover:border-amber-500/60 hover:bg-amber-500/10 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer active:scale-[0.98] transition-all duration-200"
              :class="{ 'dragging': draggedTaskId === task.id }"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Icon name="material-symbols:drag-indicator" class="text-outline-variant text-[20px] cursor-grab hover:text-amber-500 active:cursor-grabbing shrink-0 hidden sm:block" />
                <span
                  class="text-body-md text-on-surface transition-all duration-150 flex-1 min-w-0 flex items-center gap-1.5"
                >
                  <span class="line-clamp-3 break-words min-w-0 flex-1 leading-snug">{{ task.title }}</span>
                  <span v-if="copiedTaskId === task.id" class="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0 animate-pulse">
                    <Icon name="material-symbols:check-circle" class="text-[14px]" /> Copied!
                  </span>
                </span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click.stop="startFocusOnTask(task)"
                  class="px-2 py-1 bg-primary text-on-primary rounded text-xs hover:bg-primary-container transition-colors flex items-center gap-1"
                >
                  <Icon name="material-symbols:bolt" class="text-[14px]" /> Focus
                </button>
                <button
                  @click.stop="taskStore.deleteTask(task.id)"
                  class="text-outline hover:text-error p-1 rounded transition-colors shrink-0"
                  title="Delete task"
                >
                  <Icon name="material-symbols:delete" class="text-[18px]" />
                </button>
              </div>
            </div>
            <div v-if="taskStore.delegateTasks.length === 0" class="text-center text-outline text-xs py-6">
              Drop tasks to delegate here
            </div>
          </div>
        </div>

        <!-- Quadrant 4: Eliminate -->
        <div
          class="matrix-quadrant bg-surface-bright rounded-xl border border-surface-variant p-4 flex flex-col relative overflow-hidden shadow-sm min-w-0"
          :class="{ 'drag-over': activeDragOverQuadrant === 'eliminate' }"
          @dragover="onDragOver($event, 'eliminate')"
          @dragleave="onDragLeave('eliminate')"
          @drop="onDrop($event, 'eliminate')"
        >
          <div class="absolute top-0 left-0 w-full h-1 bg-outline"></div>
          <div class="flex justify-between items-center mb-3">
            <div>
              <h3 class="text-headline-md font-semibold text-on-surface flex items-center gap-2">
                Eliminate
                <AppTooltip title="Eliminate (Low Urgency & Low Impact)" align="left">
                  Busy work, time drains. Cognitive junk food that triggers guilt.
                </AppTooltip>
              </h3>
              <p class="text-label-sm text-on-surface-variant">Low Urgency / Low Impact</p>
            </div>
            <span class="text-xs font-semibold px-2 py-1 bg-surface-container-high text-outline rounded-full">
              {{ taskStore.eliminateTasks.length }}
            </span>
          </div>

          <div class="flex-1 bg-surface-container-low rounded-lg p-3 space-y-2 min-h-[140px] border-2 border-dashed border-transparent transition-colors overflow-y-auto">
            <div
              v-for="task in taskStore.eliminateTasks"
              :key="task.id"
              :draggable="!isTouchDevice ? 'true' : false"
              @dragstart="onDragStart($event, task.id)"
              @dragend="onDragEnd"
              @contextmenu.prevent="onTaskContextMenu($event, task)"
              @click="handleTaskClick(task)"
              class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 hover:border-outline/60 hover:bg-surface-container-high/60 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer active:scale-[0.98] transition-all duration-200"
              :class="{ 'dragging': draggedTaskId === task.id }"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Icon name="material-symbols:drag-indicator" class="text-outline-variant text-[20px] cursor-grab hover:text-outline active:cursor-grabbing shrink-0 hidden sm:block" />
                <span
                  class="text-body-md text-on-surface line-through text-outline transition-all duration-150 flex-1 min-w-0 flex items-center gap-1.5"
                >
                  <span class="line-clamp-3 break-words min-w-0 flex-1 leading-snug">{{ task.title }}</span>
                  <span v-if="copiedTaskId === task.id" class="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0 not-italic no-underline animate-pulse">
                    <Icon name="material-symbols:check-circle" class="text-[14px]" /> Copied!
                  </span>
                </span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click.stop="startFocusOnTask(task)"
                  class="px-2 py-1 bg-primary text-on-primary rounded text-xs hover:bg-primary-container transition-colors flex items-center gap-1"
                >
                  <Icon name="material-symbols:bolt" class="text-[14px]" /> Focus
                </button>
                <button
                  @click.stop="taskStore.deleteTask(task.id)"
                  class="text-outline hover:text-error p-1 rounded transition-colors shrink-0"
                  title="Delete task"
                >
                  <Icon name="material-symbols:delete" class="text-[18px]" />
                </button>
              </div>
            </div>
            <div v-if="taskStore.eliminateTasks.length === 0" class="text-center text-outline text-xs py-6">
              Drop distraction items to eliminate here
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Right-Click Context Menu -->
    <TaskContextMenu
      :show="contextMenuShow"
      :x="contextMenuX"
      :y="contextMenuY"
      :task="selectedTask"
      @close="contextMenuShow = false"
      @move="handleContextMove"
      @focus="handleContextFocus"
      @detail="handleContextDetail"
      @complete="handleContextComplete"
      @delete="handleContextDelete"
    />
  </div>
</template>
