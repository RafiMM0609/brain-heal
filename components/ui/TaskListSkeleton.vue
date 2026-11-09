<script setup lang="ts">
/**
 * Task list skeleton.
 *
 * Audit F-03: `isLoading` existed in the store but was never rendered, so a slow
 * fetch looked like an empty app. These placeholders give the layout a stable
 * shape while data arrives.
 */
withDefaults(defineProps<{ rows?: number }>(), { rows: 4 })
</script>

<template>
  <div class="space-y-2.5" role="status" aria-live="polite" aria-label="Loading tasks">
    <div
      v-for="i in rows"
      :key="i"
      class="h-11 rounded-lg bg-surface-container-high/70 animate-pulse"
      :style="{ animationDelay: `${i * 80}ms` }"
    />
    <span class="sr-only">Loading tasks…</span>
  </div>
</template>
