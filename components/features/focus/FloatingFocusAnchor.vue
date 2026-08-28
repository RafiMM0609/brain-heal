<script setup lang="ts">
import { useFocusStore } from '~/stores/useFocusStore'
import { useTaskStore } from '~/stores/useTaskStore'
import AppModal from '~/components/ui/AppModal.vue'

const focusStore = useFocusStore()
const taskStore = useTaskStore()
const router = useRouter()
const isSelectorOpen = ref(false)
const isMinimized = ref(false)

function selectTask(id: string, title: string) {
  focusStore.setFocusTask(id, title)
  isSelectorOpen.value = false
}

function navigateToFocusMode() {
  router.push('/execute')
}

function toggleTimer() {
  if (focusStore.isRunning) {
    focusStore.pauseTimer()
  } else {
    focusStore.startTimer()
  }
}
</script>

<template>
  <aside
    aria-label="Floating Focus Anchor"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 w-11/12 max-w-2xl px-2"
  >
    <!-- Minimized Pill View -->
    <div
      v-if="isMinimized"
      class="bg-surface-bright/95 backdrop-blur-md border border-primary/30 text-on-surface shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 mx-auto w-fit cursor-pointer hover:border-primary transition-all group"
      @click="isMinimized = false"
    >
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0"></span>
        <span class="text-xs uppercase font-bold tracking-wider text-primary">Anchor</span>
      </div>
      <span class="text-sm font-semibold text-on-surface max-w-[180px] sm:max-w-[280px] truncate">
        {{ focusStore.activeTaskTitle || 'No active task' }}
      </span>
      <span class="text-xs font-mono px-2 py-0.5 bg-primary-container text-on-primary-container rounded-md font-semibold shrink-0">
        {{ focusStore.formattedTime }}
      </span>
      <button
        @click.stop="isMinimized = false"
        class="text-outline group-hover:text-primary transition-colors p-1"
        title="Expand focus anchor"
      >
        <Icon name="material-symbols:open-in-full" class="text-[18px]" />
      </button>
    </div>

    <!-- Expanded Floating Anchor Bar -->
    <div
      v-else
      class="bg-surface-bright/95 backdrop-blur-md border border-surface-variant shadow-2xl rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-on-surface"
    >
      <!-- Left: Active Task Info -->
      <div class="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
        <div class="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 flex items-center justify-center">
          <Icon name="material-symbols:anchor" class="text-[22px] animate-pulse" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-primary px-1.5 py-0.5 bg-primary/10 rounded">
              Focus Anchor
            </span>
            <span class="text-xs text-outline hidden md:inline">Single-Task Lock</span>
          </div>
          <h3 class="text-sm sm:text-base font-bold text-on-surface truncate leading-snug" :title="focusStore.activeTaskTitle">
            {{ focusStore.activeTaskTitle || 'Select a focus task...' }}
          </h3>
        </div>
      </div>

      <!-- Right: Action & Controls -->
      <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-surface-variant">
        <!-- Timer Badge & Quick Play/Pause -->
        <div class="flex items-center bg-surface-container-low border border-surface-variant rounded-lg p-1 gap-1">
          <span class="text-xs font-mono font-bold text-primary px-2">
            {{ focusStore.formattedTime }}
          </span>
          <button
            @click="toggleTimer"
            class="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors flex items-center justify-center"
            :title="focusStore.isRunning ? 'Pause Timer' : 'Start Timer'"
          >
            <Icon :name="focusStore.isRunning ? 'material-symbols:pause' : 'material-symbols:play-arrow'" class="text-[18px]" />
          </button>
        </div>

        <!-- Task Switcher button -->
        <button
          @click="isSelectorOpen = true"
          class="p-2 text-outline hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
          title="Switch active task"
        >
          <Icon name="material-symbols:edit" class="text-[20px]" />
        </button>

        <!-- Distraction Dump Quick Trigger -->
        <button
          @click="focusStore.toggleDistractionDump()"
          class="px-2.5 py-1.5 text-xs font-semibold bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-surface-variant rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          title="Instant Distraction Dump (Alt + D)"
        >
          <Icon name="material-symbols:add-circle" class="text-[16px] text-secondary" />
          <span class="hidden sm:inline">Dump</span>
          <span class="text-[10px] text-outline font-mono bg-surface px-1 py-0.5 rounded border border-surface-variant">Alt+D</span>
        </button>

        <!-- Enter Full Focus Mode Page -->
        <button
          @click="navigateToFocusMode"
          class="px-3 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-colors flex items-center gap-1 shrink-0"
        >
          <Icon name="material-symbols:bolt" class="text-[16px]" />
          <span>Focus Page</span>
        </button>

        <!-- Minimize toggle -->
        <button
          @click="isMinimized = true"
          class="p-1.5 text-outline hover:text-on-surface transition-colors rounded-lg"
          title="Minimize anchor bar"
        >
          <Icon name="material-symbols:close-fullscreen" class="text-[18px]" />
        </button>
      </div>
    </div>

    <!-- Task Selector Modal -->
    <AppModal :isOpen="isSelectorOpen" title="Select Primary Focus Anchor" @close="isSelectorOpen = false">
      <div class="space-y-3">
        <p class="text-body-md text-on-surface-variant mb-4">
          Choose a single task to lock into your prefrontal cortex. This anchor keeps your attention span intact:
        </p>

        <div v-if="taskStore.tasks.length === 0" class="text-center py-6 text-outline">
          No tasks found. Add tasks in the Priority Engine first.
        </div>

        <div
          v-for="task in taskStore.tasks.filter(t => !t.completed)"
          :key="task.id"
          @click="selectTask(task.id, task.title)"
          class="p-3 sm:p-4 bg-surface-container-low rounded-xl border border-surface-variant hover:border-primary/50 cursor-pointer flex items-center justify-between group transition-all"
          :class="{ 'border-primary bg-primary/10': focusStore.activeTaskId === task.id }"
        >
          <div class="flex items-center gap-3">
            <Icon :name="focusStore.activeTaskId === task.id ? 'material-symbols:radio-button-checked' : 'material-symbols:radio-button-unchecked'" class="text-primary text-[20px]" />
            <div>
              <h4 class="font-semibold text-on-surface text-sm sm:text-base">{{ task.title }}</h4>
              <span class="text-[11px] text-outline uppercase font-medium">Quadrant: {{ task.quadrant }}</span>
            </div>
          </div>
          <span
            v-if="focusStore.activeTaskId === task.id"
            class="text-xs text-primary font-bold px-2 py-1 bg-primary-container text-on-primary-container rounded-md"
          >
            ACTIVE
          </span>
        </div>
      </div>
    </AppModal>
  </aside>
</template>
