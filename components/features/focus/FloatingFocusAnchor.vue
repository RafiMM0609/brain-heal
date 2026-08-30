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
    class="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 w-11/12 max-w-2xl px-2"
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
      class="bg-surface-bright/95 backdrop-blur-md border border-surface-variant shadow-2xl rounded-2xl px-3 py-2 sm:px-4 flex items-center justify-between gap-2 text-on-surface"
    >
      <!-- Left: Active Task Info -->
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></span>
        <h3 class="text-xs sm:text-sm font-bold text-on-surface truncate leading-snug" :title="focusStore.activeTaskTitle">
          {{ focusStore.activeTaskTitle || 'Select focus task...' }}
        </h3>
        <button
          @click="isSelectorOpen = true"
          class="p-1 text-outline hover:text-primary rounded transition-colors shrink-0"
          title="Switch active task"
        >
          <Icon name="material-symbols:edit-outline" class="text-[16px]" />
        </button>
      </div>

      <!-- Right: Action & Controls -->
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Timer Badge -->
        <span class="text-xs font-mono font-extrabold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
          {{ focusStore.formattedTime }}
        </span>

        <!-- Play / Pause Icon Button -->
        <button
          @click="toggleTimer"
          class="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors flex items-center justify-center"
          :title="focusStore.isRunning ? 'Pause Timer' : 'Start Timer'"
        >
          <Icon :name="focusStore.isRunning ? 'material-symbols:pause-rounded' : 'material-symbols:play-arrow-rounded'" class="text-[20px]" />
        </button>

        <!-- Complete Task & Close Mind (Mental Closure) Icon Button -->
        <button
          @click="focusStore.openMentalClosure()"
          class="p-1.5 rounded-lg bg-secondary/15 hover:bg-secondary/30 text-secondary transition-colors flex items-center justify-center"
          title="Complete Task & Close Mind"
        >
          <Icon name="material-symbols:check-circle-outline" class="text-[20px]" />
        </button>

        <!-- Stop Timer Icon Button -->
        <button
          @click="focusStore.stopTimer()"
          class="p-1.5 rounded-lg bg-surface-container-high hover:bg-error/20 hover:text-error text-outline transition-colors flex items-center justify-center"
          title="Stop Timer"
        >
          <Icon name="material-symbols:stop-rounded" class="text-[20px]" />
        </button>

        <!-- Distraction Dump Quick Trigger Icon Button -->
        <button
          @click="focusStore.toggleDistractionDump()"
          class="p-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors flex items-center justify-center"
          title="Dump Thought (Alt + D)"
        >
          <Icon name="material-symbols:lightbulb-outline" class="text-[20px]" />
        </button>

        <!-- Enter Full Focus Mode Page Icon Button -->
        <button
          @click="navigateToFocusMode"
          class="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary/20 hover:text-primary text-outline transition-colors flex items-center justify-center"
          title="Open Focus Page"
        >
          <Icon name="material-symbols:bolt" class="text-[20px]" />
        </button>

        <!-- Minimize toggle -->
        <button
          @click="isMinimized = true"
          class="p-1 text-outline hover:text-on-surface transition-colors rounded"
          title="Minimize anchor bar"
        >
          <Icon name="material-symbols:close-fullscreen" class="text-[16px]" />
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
