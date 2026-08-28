<script setup lang="ts">
import { useFocusStore } from '~/stores/useFocusStore'
import { useDocumentPiP } from '~/composables/useDocumentPiP'

const focusStore = useFocusStore()
const { pipWindow, isSupported, togglePiP } = useDocumentPiP()

// Calculate SVG stroke offset for circle progress bar
const strokeDashoffset = computed(() => {
  const totalLength = 880
  const progress = focusStore.progressPercent / 100
  return totalLength - (totalLength * progress)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-6 relative w-full">
    <!-- Active Focus Task Header Banner -->
    <div class="mb-6 text-center max-w-xl px-4">
      <span class="text-xs uppercase font-bold tracking-wider text-primary px-2.5 py-1 bg-primary/10 rounded-full">
        Current Focus Anchor
      </span>
      <h2 class="text-2xl font-bold text-on-surface mt-2 truncate" :title="focusStore.activeTaskTitle">
        {{ focusStore.activeTaskTitle || 'Select a task to focus on' }}
      </h2>
    </div>

    <!-- Duration Mode Switcher -->
    <div class="flex gap-2 p-1.5 bg-surface-container-low rounded-xl mb-8 border border-surface-variant">
      <button
        @click="focusStore.setMode('work', 25)"
        class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        :class="focusStore.mode === 'work' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'"
      >
        Deep Work (25m)
      </button>
      <button
        @click="focusStore.setMode('shortBreak', 5)"
        class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        :class="focusStore.mode === 'shortBreak' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'"
      >
        Short Break (5m)
      </button>
      <button
        @click="focusStore.setMode('longBreak', 15)"
        class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        :class="focusStore.mode === 'longBreak' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'"
      >
        Long Break (15m)
      </button>
    </div>

    <!-- Large SVG Circular Pomodoro Timer -->
    <div class="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center mb-8">
      <svg class="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 300 300">
        <!-- Background Circle -->
        <circle cx="150" cy="150" r="140" fill="none" stroke="#f3f4f5" stroke-width="10" />
        <!-- Progress Circle -->
        <circle
          cx="150"
          cy="150"
          r="140"
          fill="none"
          stroke="#406840"
          stroke-width="10"
          stroke-linecap="round"
          class="timer-circle"
          :style="{ strokeDashoffset: `${strokeDashoffset}` }"
        />
      </svg>

      <div class="text-center z-10 relative">
        <div class="text-display-lg font-bold text-primary tracking-tight font-mono text-5xl md:text-6xl">
          {{ focusStore.formattedTime }}
        </div>
        <div class="text-label-md text-on-surface-variant font-medium mt-3">
          {{ focusStore.mode === 'work' ? 'Deep Work Session' : 'Resting State' }}
        </div>
      </div>
    </div>

    <!-- Timer Controls & Document PiP trigger -->
    <div class="flex flex-col items-center gap-4 mb-8 z-10">
      <div class="flex items-center gap-6">
        <!-- Stop Button -->
        <button
          @click="focusStore.stopTimer()"
          class="w-14 h-14 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary hover:bg-surface-container-low transition-all"
          title="Reset session"
        >
          <Icon name="material-symbols:stop" class="text-[28px]" />
        </button>

        <!-- Play / Pause Main Button -->
        <button
          @click="focusStore.isRunning ? focusStore.pauseTimer() : focusStore.startTimer()"
          class="w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
          :title="focusStore.isRunning ? 'Pause' : 'Start'"
        >
          <Icon :name="focusStore.isRunning ? 'material-symbols:pause' : 'material-symbols:play-arrow'" class="text-[40px]" />
        </button>

        <!-- Skip Button -->
        <button
          @click="focusStore.skipTimer()"
          class="w-14 h-14 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary hover:bg-surface-container-low transition-all"
          title="Skip session"
        >
          <Icon name="material-symbols:skip-next" class="text-[28px]" />
        </button>
      </div>

      <!-- Pop out Document PiP Button -->
      <button
        v-if="isSupported"
        @click="togglePiP()"
        class="mt-2 px-5 py-2.5 bg-surface-bright border border-primary/40 rounded-xl text-primary font-semibold text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 shadow-sm"
        :class="{ 'bg-secondary text-on-secondary border-transparent': pipWindow }"
      >
        <Icon name="material-symbols:picture-in-picture-alt" class="text-[20px]" />
        <span>{{ pipWindow ? 'Close Always-on-Top Window' : 'Pop out Always-on-Top PiP Window' }}</span>
      </button>
    </div>

    <!-- Floating Distraction Dump Trigger (Bottom Right) -->
    <div class="fixed bottom-8 right-8 z-20">
      <button
        @click="focusStore.toggleDistractionDump()"
        class="flex items-center gap-3 px-6 py-3.5 bg-surface rounded-full shadow-lg border border-surface-variant hover:border-primary/30 hover:bg-surface-bright transition-all group"
      >
        <div class="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center group-hover:bg-primary-fixed group-hover:text-on-primary-fixed transition-colors">
          <Icon name="material-symbols:add" class="text-[20px]" />
        </div>
        <span class="text-label-md font-semibold text-on-surface">Distraction Dump</span>
      </button>
    </div>
  </div>
</template>
