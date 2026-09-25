<script setup lang="ts">
import type { QuadrantType, TaskItem } from '~/types/task'

interface Props {
  task: TaskItem
  isCopied?: boolean
  isTouchDevice?: boolean
  isDragging?: boolean
  variant?: QuadrantType
}

const props = withDefaults(defineProps<Props>(), {
  isCopied: false,
  isTouchDevice: false,
  isDragging: false,
  variant: 'inbox'
})

const emit = defineEmits<{
  (e: 'click', task: TaskItem): void
  (e: 'dragstart', event: DragEvent, taskId: string): void
  (e: 'dragend'): void
  (e: 'contextmenu', event: MouseEvent, task: TaskItem): void
  (e: 'focus', task: TaskItem): void
  (e: 'delete', taskId: string): void
}>()

const cardVariantClasses = computed(() => {
  switch (props.variant) {
    case 'do-first':
      return 'hover:border-error/60 hover:bg-error-container/10'
    case 'schedule':
      return 'hover:border-primary/60 hover:bg-primary-container/10'
    case 'delegate':
      return 'hover:border-amber-500/60 hover:bg-amber-500/10'
    case 'eliminate':
      return 'hover:border-outline/60 hover:bg-surface-container-high/60'
    default:
      return 'hover:border-primary/50 hover:bg-surface-container-low'
  }
})

const dragIconColorClass = computed(() => {
  switch (props.variant) {
    case 'do-first':
      return 'hover:text-error'
    case 'schedule':
      return 'hover:text-primary'
    case 'delegate':
      return 'hover:text-amber-500'
    case 'eliminate':
      return 'hover:text-outline'
    default:
      return 'hover:text-primary'
  }
})

const textVariantClass = computed(() => {
  if (props.variant === 'eliminate') {
    return 'line-through text-outline'
  }
  if (props.variant === 'do-first' || props.variant === 'schedule') {
    return 'font-medium'
  }
  return ''
})
</script>

<template>
  <div
    :draggable="!isTouchDevice ? 'true' : false"
    @dragstart="emit('dragstart', $event, task.id)"
    @dragend="emit('dragend')"
    @contextmenu.prevent="emit('contextmenu', $event, task)"
    @click="emit('click', task)"
    class="task-card bg-surface p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 hover:shadow-md hover:-translate-y-0.5 group cursor-pointer active:scale-[0.98] transition-all duration-200"
    :class="[cardVariantClasses, { 'dragging': isDragging }]"
  >
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <Icon
        name="material-symbols:drag-indicator"
        class="text-outline-variant text-[20px] cursor-grab active:cursor-grabbing shrink-0 hidden sm:block"
        :class="dragIconColorClass"
      />
      <span
        class="text-body-md text-on-surface transition-all duration-150 flex-1 min-w-0 flex items-center gap-1.5"
        :class="textVariantClass"
      >
        <span class="line-clamp-3 break-words min-w-0 flex-1 leading-snug">{{ task.title }}</span>
        <span
          v-if="isCopied"
          class="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0 animate-pulse"
          :class="{ 'not-italic no-underline': variant === 'eliminate' }"
        >
          <Icon name="material-symbols:check-circle" class="text-[14px]" /> Copied!
        </span>
      </span>
    </div>
    <div class="flex items-center gap-1 shrink-0">
      <button
        @click.stop="emit('focus', task)"
        class="px-2 py-1 bg-primary text-on-primary rounded text-xs hover:bg-primary-container transition-colors flex items-center gap-1"
      >
        <Icon name="material-symbols:bolt" class="text-[14px]" /> Focus
      </button>
      <button
        @click.stop="emit('delete', task.id)"
        class="text-outline hover:text-error p-1 rounded transition-colors shrink-0"
        title="Delete task"
      >
        <Icon name="material-symbols:delete" class="text-[18px]" />
      </button>
    </div>
  </div>
</template>
