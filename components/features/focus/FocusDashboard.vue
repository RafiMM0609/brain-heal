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

const strokeColor = computed(() => {
  if (focusStore.mode === 'work') return '#002446'
  return '#406840'
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-2 sm:py-6 relative w-full max-w-xl mx-auto">
    <!-- Active Focus Task Header Banner -->
    <div class="mb-4 sm:mb-6 text-center w-full px-4">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full text-[11px] sm:text-xs font-bold tracking-wider uppercase mb-2">
        <Icon name="material-symbols:bolt" class="text-[14px]" :class="{ 'animate-spin': focusStore.isRunning }" />
        <span>Current Focus Anchor</span>
      </div>

      <h2 class="text-xl sm:text-2xl font-extrabold text-on-surface line-clamp-2 leading-tight px-2" :title="focusStore.activeTaskTitle">
        {{ focusStore.activeTaskTitle || 'No Active Task Selected' }}
      </h2>

      <div v-if="!focusStore.activeTaskTitle" class="mt-2">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Icon name="material-symbols:add" class="text-[16px]" />
          <span>Select or create a task in Prep tab</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Duration Mode Switcher -->
    <div class="w-full max-w-sm sm:max-w-md p-1.5 bg-surface-container-low/90 backdrop-blur-md rounded-2xl mb-6 border border-surface-variant flex gap-1 shadow-sm">
      <button
        @click="focusStore.setMode('work', 25)"
        class="flex-1 py-2 px-1 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 text-center"
        :class="focusStore.mode === 'work' ? 'bg-primary text-on-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'"
      >
        <span>Deep Work</span>
        <span class="text-[10px] opacity-75">(25m)</span>
      </button>

      <button
        @click="focusStore.setMode('shortBreak', 5)"
        class="flex-1 py-2 px-1 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 text-center"
        :class="focusStore.mode === 'shortBreak' ? 'bg-secondary text-on-secondary shadow-sm font-bold' : 'text-on-surface-variant hover:text-secondary hover:bg-surface-container'"
      >
        <span>Short Break</span>
        <span class="text-[10px] opacity-75">(5m)</span>
      </button>

      <button
        @click="focusStore.setMode('longBreak', 15)"
        class="flex-1 py-2 px-1 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 text-center"
        :class="focusStore.mode === 'longBreak' ? 'bg-secondary text-on-secondary shadow-sm font-bold' : 'text-on-surface-variant hover:text-secondary hover:bg-surface-container'"
      >
        <span>Long Break</span>
        <span class="text-[10px] opacity-75">(15m)</span>
      </button>
    </div>

    <!-- Large SVG Circular Pomodoro Timer with Ambient Glow -->
    <div class="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center mb-6 sm:mb-8">
      <!-- Ambient Backlight Blur Glow -->
      <div class="absolute inset-4 rounded-full bg-gradient-to-tr from-primary/10 via-secondary/15 to-transparent blur-2xl pointer-events-none" />

      <svg class="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 300 300">
        <!-- Background Track Circle -->
        <circle cx="150" cy="150" r="140" fill="none" stroke="#e1e3e4" stroke-width="12" class="opacity-60" />
        <!-- Animated Progress Arc Circle -->
        <circle
          cx="150"
          cy="150"
          r="140"
          fill="none"
          :stroke="strokeColor"
          stroke-width="12"
          stroke-linecap="round"
          class="timer-circle"
          :style="{ strokeDashoffset: `${strokeDashoffset}` }"
        />
      </svg>

      <div class="text-center z-10 relative flex flex-col items-center justify-center">
        <div class="text-display-lg font-bold text-primary tracking-tight font-mono text-5xl sm:text-6xl md:text-7xl drop-shadow-sm">
          {{ focusStore.formattedTime }}
        </div>
        <div class="text-xs sm:text-sm font-semibold px-3 py-1 rounded-full text-on-surface-variant bg-surface-container-high/80 border border-surface-variant/50 inline-block mt-2 shadow-2xs">
          {{ focusStore.mode === 'work' ? '🧠 Deep Work Session' : '🌿 Resting & Resetting' }}
        </div>
      </div>
    </div>

    <!-- Timer Controls & Picture-in-Picture trigger -->
    <div class="flex flex-col items-center gap-4 mb-4 sm:mb-8 z-10 w-full">
      <div class="flex items-center gap-6">
        <!-- Reset / Stop Button -->
        <button
          @click="focusStore.stopTimer()"
          class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-surface-variant bg-surface-bright flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary hover:bg-surface-container-low transition-all shadow-sm active:scale-90"
          title="Reset session"
        >
          <Icon name="material-symbols:stop" class="text-[24px] sm:text-[28px]" />
        </button>

        <!-- Play / Pause Main Button -->
        <div class="relative">
          <div
            v-if="focusStore.isRunning"
            class="absolute -inset-1.5 rounded-full bg-primary/25 animate-ping pointer-events-none"
          />
          <button
            @click="focusStore.isRunning ? focusStore.pauseTimer() : focusStore.startTimer()"
            class="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xl hover:shadow-2xl hover:opacity-95 transition-all active:scale-95 relative z-10 border-2 border-surface-bright"
            :title="focusStore.isRunning ? 'Pause' : 'Start'"
          >
            <Icon :name="focusStore.isRunning ? 'material-symbols:pause' : 'material-symbols:play-arrow'" class="text-[36px] sm:text-[42px]" />
          </button>
        </div>

        <!-- Skip Button -->
        <button
          @click="focusStore.skipTimer()"
          class="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-surface-variant bg-surface-bright flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary hover:bg-surface-container-low transition-all shadow-sm active:scale-90"
          title="Skip session"
        >
          <Icon name="material-symbols:skip-next" class="text-[24px] sm:text-[28px]" />
        </button>
      </div>

      <!-- Pop out Document PiP Button (Desktop / Supported Browsers) -->
      <button
        v-if="isSupported"
        @click="togglePiP()"
        class="mt-1 px-4 py-2 bg-surface-bright border border-primary/30 rounded-xl text-primary font-semibold text-xs sm:text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 shadow-sm"
        :class="{ 'bg-secondary text-on-secondary border-transparent': pipWindow }"
      >
        <Icon name="material-symbols:picture-in-picture-alt" class="text-[18px]" />
        <span>{{ pipWindow ? 'Close Floating Window' : 'Pop out PiP Window' }}</span>
      </button>
    </div>

    <!-- Floating Distraction Dump Trigger (Desktop Only) -->
    <div class="hidden md:flex fixed bottom-8 right-8 z-20">
      <button
        @click="focusStore.toggleDistractionDump()"
        class="flex items-center gap-3 px-5 py-3 bg-surface-bright rounded-full shadow-lg border border-surface-variant hover:border-primary/40 hover:bg-surface transition-all group"
      >
        <div class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
          <Icon name="material-symbols:add" class="text-[18px]" />
        </div>
        <span class="text-xs font-bold text-on-surface">Distraction Dump</span>
      </button>
    </div>
  </div>
</template>
