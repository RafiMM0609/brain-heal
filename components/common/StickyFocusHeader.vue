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
  <header
    v-if="focusStore.activeTaskTitle && route.path !== '/execute'"
    class="sticky top-0 left-0 right-0 z-40 bg-surface-bright/95 backdrop-blur-md border-b border-surface-variant px-3.5 py-2.5 pt-safe flex items-center justify-between shadow-sm md:hidden transition-all"
  >
    <!-- Left Capsule: Active Task Info -->
    <div
      @click="goToFocusPage"
      class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer active:opacity-80 transition-opacity"
    >
      <div class="relative shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
        <Icon name="material-symbols:bolt" class="text-[18px]" :class="{ 'animate-bounce': focusStore.isRunning }" />
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
          {{ focusStore.activeTaskTitle }}
        </h4>
      </div>
    </div>

    <!-- Right Controls: Timer & Play/Pause -->
    <div class="flex items-center gap-1.5 shrink-0 ml-2">
      <div
        @click="goToFocusPage"
        class="bg-surface-container-high border border-surface-variant px-2.5 py-1 rounded-full text-xs font-mono font-bold text-primary cursor-pointer flex items-center gap-1"
      >
        <span>{{ focusStore.formattedTime }}</span>
      </div>

      <button
        @click.stop="toggleTimer"
        class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-transform active:scale-90 shadow-sm"
        :title="focusStore.isRunning ? 'Pause Timer' : 'Start Timer'"
      >
        <Icon :name="focusStore.isRunning ? 'material-symbols:pause' : 'material-symbols:play-arrow'" class="text-[20px]" />
      </button>
    </div>
  </header>
</template>
