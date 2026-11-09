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

const quadrantLabel = computed(() => {
  switch (props.variant) {
    case 'do-first': return 'Do First'
    case 'schedule': return 'Schedule'
    case 'delegate': return 'Delegate'
    case 'eliminate': return 'Eliminate'
    default: return 'Raw Inbox'
  }
})

const cardVariantClasses = computed(() => {
  switch (props.variant) {
    case 'do-first':
      return 'hover:border-error/60 hover:bg-error-container/10'
    case 'schedule':
      return 'hover:border-primary/60 hover:bg-primary-container/10'
    case 'delegate':
      return 'hover:border-status-warn/60 hover:bg-status-warn-surface'
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
      return 'hover:text-status-warn'
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
  <!--
    Audit A-02: the card used to be a plain <div> with a click handler, so it was
    unreachable by keyboard (tabIndex -1, no role). The title is now a real
    <button> — the card's primary action — which keeps the markup free of
    nested interactive elements while making the list fully navigable.
  -->
  <div
    :draggable="!isTouchDevice ? 'true' : false"
    @dragstart="emit('dragstart', $event, task.id)"
    @dragend="emit('dragend')"
    @contextmenu.prevent="emit('contextmenu', $event, task)"
    class="task-card bg-surface p-2.5 sm:p-3 rounded-lg border border-surface-variant shadow-sm flex items-center justify-between gap-2 hover:shadow-md hover:-translate-y-0.5 group active:scale-[0.98] transition-all duration-200"
    :class="[cardVariantClasses, { 'dragging': isDragging }]"
  >
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <Icon
        name="material-symbols:drag-indicator"
        class="text-outline-variant text-[20px] cursor-grab active:cursor-grabbing shrink-0 hidden xl:block"
        :class="dragIconColorClass"
        aria-hidden="true"
      />
      <button
        type="button"
        @click="emit('click', task)"
        class="text-left text-body-md text-on-surface transition-all duration-150 flex-1 min-w-0 flex items-center gap-1.5 cursor-pointer rounded-md min-h-11 py-1"
        :aria-label="`${task.title} — open details (${quadrantLabel})`"
      >
        <span class="line-clamp-3 break-words min-w-0 flex-1 leading-snug" :class="textVariantClass">{{ task.title }}</span>
        <span
          v-if="isCopied"
          class="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0"
          :class="{ 'no-underline': variant === 'eliminate' }"
        >
          <Icon name="material-symbols:check-circle" class="text-[14px]" aria-hidden="true" /> Copied
        </span>
      </button>
    </div>
    <div class="flex items-center gap-1 shrink-0">
      <button
        @click.stop="emit('focus', task)"
        class="min-h-11 min-w-11 xl:min-h-0 xl:min-w-0 px-2.5 py-2 xl:py-1 bg-primary text-on-primary rounded-md text-xs font-semibold hover:bg-primary-container transition-colors flex items-center justify-center gap-1"
        :aria-label="`Focus on ${task.title}`"
      >
        <Icon name="material-symbols:bolt" class="text-[14px]" aria-hidden="true" />
        <span class="hidden sm:inline">Focus</span>
      </button>
      <button
        @click.stop="emit('delete', task.id)"
        class="text-outline-variant hover:text-error p-2 rounded-md transition-colors shrink-0 min-h-11 min-w-11 xl:min-h-0 xl:min-w-0 flex items-center justify-center"
        :aria-label="`Delete ${task.title}`"
      >
        <Icon name="material-symbols:delete" class="text-[18px]" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
