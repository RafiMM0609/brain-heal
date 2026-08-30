<script setup lang="ts">
import { useTaskTooltip } from '~/composables/useTaskTooltip'

const { tooltipState } = useTaskTooltip()

const clampedStyle = computed(() => {
  if (typeof window === 'undefined') return {}
  
  // Clamp X between 120px and (window.innerWidth - 120px) to prevent screen overflow
  const clampedX = Math.max(140, Math.min(window.innerWidth - 140, tooltipState.value.x))
  // If top is too close to top of screen (< 60px), position below instead of above
  const isNearTop = tooltipState.value.y < 60
  
  return {
    left: `${clampedX}px`,
    top: isNearTop ? `${tooltipState.value.y + 40}px` : `${tooltipState.value.y}px`,
    transform: isNearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="tooltipState.show"
      :style="clampedStyle"
      class="fixed z-[99999] pointer-events-none max-w-xs sm:max-w-md w-max p-2.5 bg-slate-900/95 dark:bg-slate-800/95 text-slate-100 text-xs rounded-xl shadow-2xl border border-slate-700/60 backdrop-blur-md leading-snug break-words font-sans transition-all duration-75"
      role="tooltip"
    >
      <div class="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-primary mb-0.5">
        <Icon name="material-symbols:info" class="text-[12px]" />
        <span>Detail Tugas</span>
      </div>
      <p class="font-normal text-slate-100">{{ tooltipState.title }}</p>
      <!-- Arrow indicator at bottom -->
      <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95"></div>
    </div>
  </Teleport>
</template>
