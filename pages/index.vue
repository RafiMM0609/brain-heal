<script setup lang="ts">
import RapidInputCanvas from '~/components/features/prep/RapidInputCanvas.vue'
import PriorityEngineMatrix from '~/components/features/prep/PriorityEngineMatrix.vue'

const activeTab = ref<'input' | 'matrix'>('matrix')
</script>

<template>
  <div class="space-y-6">
    <!-- View Switcher Tabs -->
    <div class="flex items-center justify-between border-b border-surface-variant pb-3">
      <div class="flex gap-4">
        <button
          @click="activeTab = 'matrix'"
          class="flex items-center gap-2 pb-2 font-semibold text-sm transition-colors border-b-2"
          :class="activeTab === 'matrix' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'"
        >
          <Icon name="material-symbols:grid-view" class="text-[20px]" />
          Priority Engine (Eisenhower)
        </button>

        <button
          @click="activeTab = 'input'"
          class="flex items-center gap-2 pb-2 font-semibold text-sm transition-colors border-b-2"
          :class="activeTab === 'input' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'"
        >
          <Icon name="material-symbols:edit-note" class="text-[20px]" />
          Rapid Input Canvas
        </button>
      </div>

      <NuxtLink
        to="/execute"
        class="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary hover:bg-primary-container/20 px-3 py-1.5 rounded-lg transition-colors"
      >
        <span>Enter Focus Mode</span>
        <Icon name="material-symbols:bolt" class="text-[18px]" />
      </NuxtLink>
    </div>

    <!-- Active Tab Component -->
    <div v-if="activeTab === 'matrix'">
      <PriorityEngineMatrix />
    </div>
    <div v-else-if="activeTab === 'input'">
      <RapidInputCanvas @next="activeTab = 'matrix'" />
    </div>
  </div>
</template>
