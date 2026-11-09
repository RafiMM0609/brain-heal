<script setup lang="ts">
import RapidInputCanvas from '~/components/features/prep/RapidInputCanvas.vue'
import PriorityEngineMatrix from '~/components/features/prep/PriorityEngineMatrix.vue'

/**
 * Audit C-02: /execute used to be reachable from five equal-looking entry
 * points. The page now carries one primary action ("Start focus"); the sidebar
 * "Start Deep Work" CTA was demoted to a normal nav item.
 */
const activeTab = ref<'input' | 'matrix'>('matrix')

const tabs = [
  { key: 'matrix', label: 'Priority Engine', icon: 'material-symbols:grid-view' },
  { key: 'input', label: 'Rapid Input', icon: 'material-symbols:edit-note' }
] as const

type TabKey = typeof tabs[number]['key']

const tabRefs = ref<HTMLButtonElement[]>([])

function setTabRef(el: Element | ComponentPublicInstance | null, index: number) {
  if (el instanceof HTMLButtonElement) tabRefs.value[index] = el
}

function selectTab(key: TabKey, index: number) {
  activeTab.value = key
  nextTick(() => tabRefs.value[index]?.focus())
}

function onTabKeydown(event: KeyboardEvent, index: number) {
  const current = tabs.findIndex((t) => t.key === activeTab.value)
  let nextIndex = current

  if (event.key === 'ArrowRight') nextIndex = (current + 1) % tabs.length
  else if (event.key === 'ArrowLeft') nextIndex = (current - 1 + tabs.length) % tabs.length
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = tabs.length - 1
  else return

  event.preventDefault()
  const next = tabs[nextIndex]
  activeTab.value = next.key
  nextTick(() => tabRefs.value[nextIndex]?.focus())
  void index
}
</script>

<template>
  <div class="space-y-6 w-full max-w-full overflow-x-hidden">
    <!-- View Switcher Tabs -->
    <div class="flex flex-wrap items-center justify-between border-b border-surface-variant pb-3 gap-3">
      <div class="flex gap-1 shrink-0" role="tablist" aria-label="Prep views">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.key"
          :ref="(el) => setTabRef(el, index)"
          role="tab"
          :aria-selected="activeTab === tab.key"
          :tabindex="activeTab === tab.key ? 0 : -1"
          @click="selectTab(tab.key, index)"
          @keydown="onTabKeydown($event, index)"
          class="flex items-center gap-2 px-3 pb-2 min-h-11 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap"
          :class="activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'"
        >
          <Icon :name="tab.icon" class="text-[20px]" aria-hidden="true" />
          {{ tab.label }}
        </button>
      </div>

      <NuxtLink
        to="/execute"
        class="hidden sm:inline-flex items-center gap-2 min-h-11 text-sm font-semibold text-on-primary bg-primary hover:bg-primary-container px-4 rounded-xl transition-colors shrink-0 whitespace-nowrap"
      >
        <span>Start focus</span>
        <Icon name="material-symbols:bolt" class="text-[18px]" aria-hidden="true" />
      </NuxtLink>
    </div>

    <!-- Active Tab Component -->
    <div v-if="activeTab === 'matrix'" role="tabpanel" aria-label="Priority Engine">
      <PriorityEngineMatrix />
    </div>
    <div v-else-if="activeTab === 'input'" role="tabpanel" aria-label="Rapid Input">
      <RapidInputCanvas @next="activeTab = 'matrix'" />
    </div>
  </div>
</template>
