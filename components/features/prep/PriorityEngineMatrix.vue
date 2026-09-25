<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import { useToast } from '~/composables/useToast'
import { useSwipeModal } from '~/composables/useSwipeModal'
import { useTaskDetailModal } from '~/composables/useTaskDetailModal'
import { useTaskDragDrop } from '~/composables/useTaskDragDrop'
import { copyTextToClipboard } from '~/utils/clipboard'
import type { QuadrantType, TaskItem } from '~/types/task'
import AppTooltip from '~/components/ui/AppTooltip.vue'
import TaskContextMenu from '~/components/ui/TaskContextMenu.vue'
import TaskItemCard from '~/components/features/prep/TaskItemCard.vue'
import MatrixQuadrantColumn from '~/components/features/prep/MatrixQuadrantColumn.vue'

const router = useRouter()
const taskStore = useTaskStore()
const { showToast } = useToast()
const { openSwipeModal } = useSwipeModal()
const { openTaskDetail } = useTaskDetailModal()

const {
  draggedTaskId,
  activeDragOverQuadrant,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  wasJustDragged
} = useTaskDragDrop()

const quickAddInput = ref('')
const isTouchDevice = ref(false)
const copiedTaskId = ref<string | null>(null)
let copyTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (typeof window !== 'undefined') {
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
})

async function copyTaskText(text: string, taskId: string) {
  const success = await copyTextToClipboard(text)
  if (success) {
    if (copyTimeout) clearTimeout(copyTimeout)
    copiedTaskId.value = taskId
    copyTimeout = setTimeout(() => {
      copiedTaskId.value = null
    }, 1500)
    showToast('📋 Copied!')
  }
}

function handleTaskClick(task: TaskItem) {
  if (wasJustDragged()) {
    return
  }
  copyTaskText(task.title, task.id)
  openTaskDetail(task)
}

function handleDrop(event: DragEvent, targetQuadrant: QuadrantType) {
  onDrop(event, targetQuadrant, (taskId, quadrant) => {
    taskStore.moveTask(taskId, quadrant)
  })
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

interface QuadrantConfig {
  key: QuadrantType
  title: string
  subtitle: string
  tooltipTitle: string
  tooltipDescription: string
  accentColorClass: string
  badgeClass: string
  emptyText: string
  tasks: TaskItem[]
}

const quadrants = computed<QuadrantConfig[]>(() => [
  {
    key: 'do-first',
    title: 'Do First',
    subtitle: 'High Urgency / High Impact',
    tooltipTitle: 'Do First (Urgent & Important)',
    tooltipDescription: 'Crises, deadlines, and core problems. High urgency and high impact.',
    accentColorClass: 'bg-error',
    badgeClass: 'bg-error-container text-on-error-container',
    emptyText: 'Drop high urgency/high impact tasks here',
    tasks: taskStore.doFirstTasks
  },
  {
    key: 'schedule',
    title: 'Schedule',
    subtitle: 'Low Urgency / High Impact',
    tooltipTitle: 'Schedule (Not Urgent & Important)',
    tooltipDescription: 'Deep work, strategic planning, skill development. Zone of peak cognitive flow.',
    accentColorClass: 'bg-primary',
    badgeClass: 'bg-primary-fixed text-on-primary-fixed',
    emptyText: 'Drop deep work tasks to schedule here',
    tasks: taskStore.scheduleTasks
  },
  {
    key: 'delegate',
    title: 'Delegate',
    subtitle: 'High Urgency / Low Impact',
    tooltipTitle: 'Delegate (Urgent & Low Impact)',
    tooltipDescription: 'Interruptions, minor administrative tasks. Creates false sense of urgency.',
    accentColorClass: 'bg-on-primary-container',
    badgeClass: 'bg-surface-container-high text-on-surface-variant',
    emptyText: 'Drop tasks to delegate here',
    tasks: taskStore.delegateTasks
  },
  {
    key: 'eliminate',
    title: 'Eliminate',
    subtitle: 'Low Urgency / Low Impact',
    tooltipTitle: 'Eliminate (Low Urgency & Low Impact)',
    tooltipDescription: 'Busy work, time drains. Cognitive junk food that triggers guilt.',
    accentColorClass: 'bg-outline',
    badgeClass: 'bg-surface-container-high text-outline',
    emptyText: 'Drop distraction items to eliminate here',
    tasks: taskStore.eliminateTasks
  }
])
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
        @drop="handleDrop($event, 'inbox')"
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
          <TaskItemCard
            v-for="task in taskStore.rawInbox"
            :key="task.id"
            :task="task"
            variant="inbox"
            :is-copied="copiedTaskId === task.id"
            :is-touch-device="isTouchDevice"
            :is-dragging="draggedTaskId === task.id"
            @click="handleTaskClick"
            @dragstart="onDragStart"
            @dragend="onDragEnd"
            @contextmenu="onTaskContextMenu"
            @focus="startFocusOnTask"
            @delete="taskStore.deleteTask"
          />

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
        <MatrixQuadrantColumn
          v-for="q in quadrants"
          :key="q.key"
          :title="q.title"
          :subtitle="q.subtitle"
          :tooltip-title="q.tooltipTitle"
          :tooltip-description="q.tooltipDescription"
          :badge-count="q.tasks.length"
          :quadrant="q.key"
          :accent-color-class="q.accentColorClass"
          :badge-class="q.badgeClass"
          :is-active-drag-over="activeDragOverQuadrant === q.key"
          :empty-text="q.emptyText"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="handleDrop"
        >
          <TaskItemCard
            v-for="task in q.tasks"
            :key="task.id"
            :task="task"
            :variant="q.key"
            :is-copied="copiedTaskId === task.id"
            :is-touch-device="isTouchDevice"
            :is-dragging="draggedTaskId === task.id"
            @click="handleTaskClick"
            @dragstart="onDragStart"
            @dragend="onDragEnd"
            @contextmenu="onTaskContextMenu"
            @focus="startFocusOnTask"
            @delete="taskStore.deleteTask"
          />
        </MatrixQuadrantColumn>
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
