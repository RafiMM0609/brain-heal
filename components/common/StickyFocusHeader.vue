<script setup lang="ts">
import { useFocusStore } from '~/stores/useFocusStore'

const focusStore = useFocusStore()
const router = useRouter()
const route = useRoute()

function toggleTimer() {
  if (focusStore.isRunning) {
    focusStore.pauseTimer()
  } else {
    focusStore.startTimer()
  }
}

function goToFocusPage() {
  router.push('/execute')
}
</script>

<template>
  <div
    v-if="route.path !== '/execute'"
    role="region"
    aria-label="Focus anchor"
    class="bg-surface-bright/95 backdrop-blur-md border-b border-surface-variant px-3.5 py-1.5 pt-safe flex items-center justify-between shadow-xs md:hidden transition-all"
  >
    <!-- Left Capsule: Active Task Info (Click to open Focus Page) -->
    <button
      type="button"
      @click="goToFocusPage"
      class="flex items-center gap-2 flex-1 min-w-0 min-h-11 text-left active:opacity-80 transition-opacity mr-2 rounded-lg"
      :title="'Open focus session'"
    >
      <div class="relative shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
        <Icon name="material-symbols:bolt" class="text-[18px]" :class="{ 'animate-bounce': focusStore.isRunning }" aria-hidden="true" />
        <span
          v-if="focusStore.isRunning"
          class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-ping"
        />
      </div>

      <div class="flex flex-col min-w-0 flex-1">
        <span class="text-[9px] font-bold uppercase tracking-wider text-primary leading-none">
          Focus Anchor
        </span>
        <h4 class="text-xs font-bold text-on-surface truncate leading-tight">
          {{ focusStore.activeTaskTitle || 'No active task' }}
        </h4>
      </div>
    </button>

    <!-- Right Controls: Timer & Play/Pause -->
    <div class="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        @click="goToFocusPage"
        class="min-h-11 bg-surface-container-high border border-surface-variant px-2.5 py-1 rounded-full text-xs font-mono font-bold text-primary flex items-center gap-1"
        title="Open focus session"
      >
        <span>{{ focusStore.formattedTime }}</span>
      </button>

      <button
        @click.stop="focusStore.openMentalClosure()"
        class="w-11 h-11 rounded-full bg-secondary/15 text-secondary flex items-center justify-center hover:bg-secondary/30 transition-transform active:scale-90 shadow-sm"
        aria-label="Complete task and close the loop"
      >
        <Icon name="material-symbols:check-circle-outline" class="text-[20px]" aria-hidden="true" />
      </button>

      <button
        @click.stop="toggleTimer"
        class="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-transform active:scale-90 shadow-sm"
        :aria-label="focusStore.isRunning ? 'Pause session' : 'Start session'"
      >
        <Icon :name="focusStore.isRunning ? 'material-symbols:pause' : 'material-symbols:play-arrow'" class="text-[22px]" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
