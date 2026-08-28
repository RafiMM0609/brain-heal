<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'
import type { QuadrantType, TaskItem } from '~/types/task'
import AppTooltip from '~/components/ui/AppTooltip.vue'

const taskStore = useTaskStore()
const quickAddInput = ref('')
const draggedTaskId = ref<string | null>(null)
const activeDragOverQuadrant = ref<QuadrantType | null>(null)

const router = useRouter()

// Drag and drop handlers
function onDragStart(event: DragEvent, taskId: string) {
  draggedTaskId.value = taskId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', taskId)
  }
}

function onDragEnd() {
  draggedTaskId.value = null
  activeDragOverQuadrant.value = null
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
</script>

<template>
  <div class="flex flex-col h-full max-w-container-max-width mx-auto w-full">
    <!-- Title & Neuroscience Header -->
    <div class="mb-6 flex justify-between items-end">
      <div>
        <h2 class="text-display-lg font-bold text-primary mb-2">Priority Engine</h2>
        <p class="text-body-lg text-on-surface-variant max-w-2xl">
          Reduce decision fatigue by categorizing tasks. The Eisenhower Matrix bypasses the amygdala's stress response, engaging the prefrontal cortex for deliberate execution.
        </p>
      </div>
      <AppTooltip title="Neuroscience Note:">
        Categorizing tasks into rigid structural buckets reduces the cognitive load required to hold them in working memory. This lowers cortisol and protects focus.
      </AppTooltip>
    </div>

    <!-- Mobile Swipe Priority Engine (Visible on mobile screens lg:hidden) -->
    <div v-if="taskStore.rawInbox.length > 0" class="block lg:hidden mb-8 bg-surface-bright border border-surface-variant rounded-2xl p-4 shadow-sm">
      <MobilePrioritySwipe />
    </div>

    <!-- Layout Grid: Raw Inbox + 4 Quadrants -->
    <div class="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
      <!-- Raw Inbox Column -->
      <div
        class="w-full lg:w-1/4 bg-surface-bright border border-surface-variant rounded-xl p-4 flex flex-col shadow-sm"
        :class="{ 'drag-over': activeDragOverQuadrant === 'inbox' }"
        @dragover="onDragOver($event, 'inbox')"
        @dragleave="onDragLeave('inbox')"
        @drop="onDrop($event, 'inbox')"
      >
        <div class="flex justify-between items-center mb-4 pb-2 border-b border-surface-variant">
          <h3 class="text-headline-md font-semibold text-on-surface">Raw Inbox</h3>
          <Icon name="material-symbols:inbox" class="text-outline text-[24px]" />
        </div>

        <div class="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[150px]">
          <div
            v-for="task in taskStore.rawInbox"
            :key="task.id"
            draggable="true"
            @dragstart="onDragStart($event, task.id)"
            @dragend="onDragEnd"
            class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 hover:border-primary/30 group"
            :class="{ 'dragging': draggedTaskId === task.id }"
          >
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <Icon name="material-symbols:drag-indicator" class="text-outline-variant text-[20px] cursor-grab shrink-0" />
              <span class="text-body-md text-on-surface truncate">{{ task.title }}</span>
            </div>
            <button
              @click.stop="taskStore.deleteTask(task.id)"
              class="text-outline hover:text-error p-1 rounded transition-colors shrink-0"
              title="Delete task"
            >
              <Icon name="material-symbols:delete" class="text-[18px]" />
            </button>
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
      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
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
                <AppTooltip title="Do First (Urgent & Important)">
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
              draggable="true"
              @dragstart="onDragStart($event, task.id)"
              @dragend="onDragEnd"
              class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 hover:border-error/40 group"
              :class="{ 'dragging': draggedTaskId === task.id }"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Icon name="material-symbols:drag-indicator" class="text-outline-variant text-[20px] cursor-grab shrink-0" />
                <span class="text-body-md text-on-surface font-medium truncate">{{ task.title }}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click="startFocusOnTask(task)"
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
          class="matrix-quadrant bg-surface-bright rounded-xl border border-surface-variant p-4 flex flex-col relative overflow-hidden shadow-sm"
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
                <AppTooltip title="Schedule (Not Urgent & Important)">
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
              draggable="true"
              @dragstart="onDragStart($event, task.id)"
              @dragend="onDragEnd"
              class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 hover:border-primary/40 group"
              :class="{ 'dragging': draggedTaskId === task.id }"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Icon name="material-symbols:drag-indicator" class="text-outline-variant text-[20px] cursor-grab shrink-0" />
                <span class="text-body-md text-on-surface font-medium truncate">{{ task.title }}</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click="startFocusOnTask(task)"
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
          class="matrix-quadrant bg-surface-bright rounded-xl border border-surface-variant p-4 flex flex-col relative overflow-hidden shadow-sm"
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
                <AppTooltip title="Delegate (Urgent & Low Impact)">
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
              draggable="true"
              @dragstart="onDragStart($event, task.id)"
              @dragend="onDragEnd"
              class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 group"
              :class="{ 'dragging': draggedTaskId === task.id }"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Icon name="material-symbols:drag-indicator" class="text-outline-variant text-[20px] cursor-grab shrink-0" />
                <span class="text-body-md text-on-surface truncate">{{ task.title }}</span>
              </div>
              <button
                @click.stop="taskStore.deleteTask(task.id)"
                class="text-outline hover:text-error p-1 rounded transition-colors shrink-0"
                title="Delete task"
              >
                <Icon name="material-symbols:delete" class="text-[18px]" />
              </button>
            </div>
            <div v-if="taskStore.delegateTasks.length === 0" class="text-center text-outline text-xs py-6">
              Drop tasks to delegate here
            </div>
          </div>
        </div>

        <!-- Quadrant 4: Eliminate -->
        <div
          class="matrix-quadrant bg-surface-bright rounded-xl border border-surface-variant p-4 flex flex-col relative overflow-hidden shadow-sm"
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
                <AppTooltip title="Eliminate (Low Urgency & Low Impact)">
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
              draggable="true"
              @dragstart="onDragStart($event, task.id)"
              @dragend="onDragEnd"
              class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 group"
              :class="{ 'dragging': draggedTaskId === task.id }"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Icon name="material-symbols:drag-indicator" class="text-outline-variant text-[20px] cursor-grab shrink-0" />
                <span class="text-body-md text-on-surface line-through text-outline truncate">{{ task.title }}</span>
              </div>
              <button
                @click.stop="taskStore.deleteTask(task.id)"
                class="text-outline hover:text-error p-1 rounded transition-colors shrink-0"
                title="Delete task"
              >
                <Icon name="material-symbols:delete" class="text-[18px]" />
              </button>
            </div>
            <div v-if="taskStore.eliminateTasks.length === 0" class="text-center text-outline text-xs py-6">
              Drop distraction items to eliminate here
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
