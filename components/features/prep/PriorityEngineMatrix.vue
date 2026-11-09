<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import { useToast } from '~/composables/useToast'
import { useSwipeModal } from '~/composables/useSwipeModal'
import { useTaskDetailModal } from '~/composables/useTaskDetailModal'
import { useTaskDragDrop } from '~/composables/useTaskDragDrop'
import { useTaskActions } from '~/composables/useTaskActions'
import type { QuadrantType, TaskItem } from '~/types/task'
import AppTooltip from '~/components/ui/AppTooltip.vue'
import AppModal from '~/components/ui/AppModal.vue'
import TaskContextMenu from '~/components/ui/TaskContextMenu.vue'
import TaskItemCard from '~/components/features/prep/TaskItemCard.vue'
import MatrixQuadrantColumn from '~/components/features/prep/MatrixQuadrantColumn.vue'
import TaskListSkeleton from '~/components/ui/TaskListSkeleton.vue'

const router = useRouter()
const taskStore = useTaskStore()
const { showToast } = useToast()
const { openSwipeModal } = useSwipeModal()
const { openTaskDetail } = useTaskDetailModal()
const { deleteTaskWithUndo } = useTaskActions()

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

onMounted(() => {
  if (typeof window !== 'undefined') {
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
})

/**
 * Audit M-04: a plain tap used to copy the title to the clipboard as a silent
 * side effect of opening the detail sheet, which also failed silently in
 * browsers without clipboard permission. Tapping now only opens the detail;
 * copying is available where it is expected (context menu / detail modal).
 */
function handleTaskClick(task: TaskItem) {
  if (wasJustDragged()) {
    return
  }
  openTaskDetail(task)
}

// --- Clear all tasks -------------------------------------------------------
// Audit F-01: the destructive action fired immediately, with no confirmation
// and no way back.
const showClearConfirm = ref(false)

function requestClearAll() {
  showClearConfirm.value = true
}

async function confirmClearAll() {
  showClearConfirm.value = false
  const previous = [...taskStore.tasks]
  await taskStore.clearAllTasks()
  if (taskStore.tasks.length === 0) {
    showToast('All tasks deleted')
  } else {
    showToast('Could not delete tasks. Please try again.', 'error')
    taskStore.tasks = previous
  }
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
    deleteTaskWithUndo(selectedTask.value.id)
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
        <h1 class="text-display-lg font-bold text-primary mb-2">Priority Engine</h1>
        <!-- Audit I-03: the neuroscience paragraph repeated on every visit pushed
             the matrix below the fold. It now collapses to one line on small
             screens and is available in full via the tooltip. -->
        <p class="text-body-lg text-on-surface-variant max-w-2xl line-clamp-2 md:line-clamp-none">
          Sort what matters before you start. Categorising tasks up front spares your prefrontal cortex for the work itself.
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <button
          v-if="taskStore.tasks.length > 0"
          @click="requestClearAll()"
          class="px-3 py-2 min-h-11 md:min-h-0 md:py-1.5 bg-error-container/40 hover:bg-error-container text-error rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-error/20"
          title="Delete every task"
        >
          <Icon name="material-symbols:delete-sweep" class="text-[16px]" aria-hidden="true" />
          <span>Clear All</span>
        </button>
        <AppTooltip title="Neuroscience Note:" align="right">
          Categorising tasks into rigid structural buckets reduces the cognitive load required to hold them in working memory. This lowers cortisol and protects focus.
        </AppTooltip>
      </div>
    </div>

    <!-- Layout Grid: Raw Inbox + 4 Quadrants -->
    <!--
      Audit V-03: the two-column split used to start at `lg` (1024px), which
      squeezed the Raw Inbox column to ~192px and collapsed task titles to 0px
      wide. The split now starts at `xl` (1280px) and the inbox keeps a floor
      width, so 1024-1279px laptops get a readable stacked layout instead.
    -->
    <div class="flex flex-col xl:flex-row gap-6 flex-1 min-h-[600px] min-w-0 w-full">
      <!-- Raw Inbox Column -->
      <div
        class="w-full xl:w-[20rem] xl:shrink-0 bg-surface-bright border border-surface-variant rounded-xl p-4 flex flex-col shadow-sm min-w-0"
        :class="{ 'drag-over': activeDragOverQuadrant === 'inbox' }"
        @dragover="onDragOver($event, 'inbox')"
        @dragleave="onDragLeave('inbox')"
        @drop="handleDrop($event, 'inbox')"
      >
        <!-- Audit V-04: title and "Swipe Mode" collided at ~1024-1280px.
             `flex-wrap` lets the action drop to its own line instead. -->
        <div class="flex flex-wrap justify-between items-center gap-2 mb-4 pb-2 border-b border-surface-variant">
          <h2 class="text-headline-md font-semibold text-on-surface">Raw inbox</h2>
          <div class="flex items-center gap-2">
            <button
              v-if="taskStore.rawInbox.length > 0"
              @click="openSwipeModal()"
              class="px-2.5 py-2 xl:py-1 min-h-11 xl:min-h-0 bg-primary text-on-primary font-bold rounded-lg text-xs flex items-center gap-1.5 hover:bg-primary-container shadow-xs transition-all"
              title="Open Swipe Priority Mode"
            >
              <Icon name="material-symbols:swipe" class="text-[16px]" aria-hidden="true" />
              <span>Swipe Mode</span>
            </button>
            <Icon name="material-symbols:inbox" class="text-outline text-[24px]" aria-hidden="true" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[150px]">
          <TaskListSkeleton v-if="taskStore.isLoading && taskStore.rawInbox.length === 0" :rows="4" />

          <TaskItemCard
            v-for="task in taskStore.rawInbox"
            :key="task.id"
            :task="task"
            variant="inbox"
            :is-touch-device="isTouchDevice"
            :is-dragging="draggedTaskId === task.id"
            @click="handleTaskClick"
            @dragstart="onDragStart"
            @dragend="onDragEnd"
            @contextmenu="onTaskContextMenu"
            @focus="startFocusOnTask"
            @delete="deleteTaskWithUndo"
          />

          <div
            v-if="!taskStore.isLoading && taskStore.rawInbox.length === 0"
            class="text-center text-on-surface-variant text-sm py-8 px-3 border border-dashed border-surface-variant rounded-lg"
          >
            <p class="font-semibold text-on-surface mb-1">Nothing captured yet</p>
            <p>Type below to add your first task, or use Rapid Input for a brain dump.</p>
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
              aria-label="Quick add task"
              class="w-full pl-3 pr-10 py-2 bg-surface-container-low border-none rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright transition-all"
            />
            <button
              @click="handleQuickAdd"
              aria-label="Add task to Raw Inbox"
              class="absolute right-1 top-1/2 -translate-y-1/2 min-h-11 min-w-11 flex items-center justify-center text-primary hover:bg-primary-container hover:text-on-primary-container rounded-md transition-colors"
            >
              <Icon name="material-symbols:add" class="text-[20px]" aria-hidden="true" />
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
            :is-touch-device="isTouchDevice"
            :is-dragging="draggedTaskId === task.id"
            @click="handleTaskClick"
            @dragstart="onDragStart"
            @dragend="onDragEnd"
            @contextmenu="onTaskContextMenu"
            @focus="startFocusOnTask"
            @delete="deleteTaskWithUndo"
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

    <!-- Confirmation for the destructive "Clear All" action (Audit F-01) -->
    <AppModal
      :isOpen="showClearConfirm"
      title="Delete all tasks?"
      @close="showClearConfirm = false"
    >
      <div class="space-y-4">
        <p class="text-body-md text-on-surface-variant">
          This removes all {{ taskStore.tasks.length }} tasks from every quadrant, including the Raw Inbox. This cannot be undone.
        </p>
        <div class="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
          <button
            type="button"
            @click="showClearConfirm = false"
            class="min-h-12 sm:min-h-0 px-4 py-2.5 rounded-xl border border-surface-variant text-on-surface-variant font-semibold text-sm hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            data-autofocus
            @click="confirmClearAll"
            class="min-h-12 sm:min-h-0 px-4 py-2.5 rounded-xl bg-error text-on-error font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Delete all tasks
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>
