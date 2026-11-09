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
  <section
    class="matrix-quadrant bg-surface-bright rounded-xl border border-surface-variant p-3 sm:p-4 flex flex-col relative overflow-hidden shadow-sm min-w-0"
    :class="{ 'drag-over': isActiveDragOver }"
    :aria-label="`${title} quadrant, ${badgeCount} tasks`"
    @dragover="emit('dragover', $event, quadrant)"
    @dragleave="emit('dragleave', quadrant)"
    @drop="emit('drop', $event, quadrant)"
  >
    <div class="absolute top-0 left-0 w-full h-1" :class="accentColorClass" aria-hidden="true" />
    <div class="flex justify-between items-start gap-2 mb-3">
      <div class="min-w-0">
        <!-- Audit: the visible heading stays short; the underlying reasoning is
             available through the (now keyboard reachable) tooltip. -->
        <h2 class="text-headline-md font-semibold text-on-surface flex items-center gap-1.5">
          <span class="truncate">{{ title }}</span>
          <AppTooltip :title="tooltipTitle" align="left">
            {{ tooltipDescription }}
          </AppTooltip>
        </h2>
        <p class="text-label-sm text-on-surface-variant">{{ subtitle }}</p>
      </div>
      <span class="text-xs font-semibold px-2 py-1 rounded-full shrink-0" :class="badgeClass">
        {{ badgeCount }}
      </span>
    </div>

    <div
      class="flex-1 bg-surface-container-low rounded-lg p-2.5 sm:p-3 space-y-2 min-h-[120px] border-2 border-dashed transition-colors overflow-y-auto"
      :class="isActiveDragOver ? 'border-primary/40' : 'border-transparent'"
    >
      <slot />
      <!-- Audit A-05: empty-state copy moved off `text-outline` (4.08:1) to a
           token that clears AA at this size. -->
      <p v-if="badgeCount === 0" class="text-center text-on-surface-variant text-xs py-5 px-2">
        {{ emptyText }}
      </p>
    </div>
  </section>
</template>
