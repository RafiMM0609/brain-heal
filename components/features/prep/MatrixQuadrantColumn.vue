<script setup lang="ts">
import type { QuadrantType } from '~/types/task'
import AppTooltip from '~/components/ui/AppTooltip.vue'

interface Props {
  title: string
  subtitle: string
  tooltipTitle: string
  tooltipDescription: string
  badgeCount: number
  quadrant: QuadrantType
  accentColorClass: string
  badgeClass: string
  isActiveDragOver: boolean
  emptyText: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'dragover', event: DragEvent, quadrant: QuadrantType): void
  (e: 'dragleave', quadrant: QuadrantType): void
  (e: 'drop', event: DragEvent, quadrant: QuadrantType): void
}>()
</script>

<template>
  <div
    class="matrix-quadrant bg-surface-bright rounded-xl border border-surface-variant p-4 flex flex-col relative overflow-hidden shadow-sm min-w-0"
    :class="{ 'drag-over': isActiveDragOver }"
    @dragover="emit('dragover', $event, quadrant)"
    @dragleave="emit('dragleave', quadrant)"
    @drop="emit('drop', $event, quadrant)"
  >
    <div class="absolute top-0 left-0 w-full h-1" :class="accentColorClass"></div>
    <div class="flex justify-between items-center mb-3">
      <div>
        <h3 class="text-headline-md font-semibold text-on-surface flex items-center gap-2">
          {{ title }}
          <AppTooltip :title="tooltipTitle" align="left">
            {{ tooltipDescription }}
          </AppTooltip>
        </h3>
        <p class="text-label-sm text-on-surface-variant">{{ subtitle }}</p>
      </div>
      <span class="text-xs font-semibold px-2 py-1 rounded-full" :class="badgeClass">
        {{ badgeCount }}
      </span>
    </div>

    <div class="flex-1 bg-surface-container-low rounded-lg p-3 space-y-2 min-h-[140px] border-2 border-dashed border-transparent transition-colors overflow-y-auto">
      <slot />
      <div v-if="badgeCount === 0" class="text-center text-outline text-xs py-6">
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>
