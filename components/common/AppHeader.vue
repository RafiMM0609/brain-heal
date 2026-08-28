<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'
import { useFocusStore } from '~/stores/useFocusStore'
import { useDocumentPiP } from '~/composables/useDocumentPiP'

const authStore = useAuthStore()
const focusStore = useFocusStore()
const { pipWindow, isSupported, togglePiP } = useDocumentPiP()
const searchQuery = ref('')
</script>

<template>
  <header class="bg-surface/95 backdrop-blur-md shadow-xs flex justify-between items-center w-full px-4 py-3 pt-safe md:px-8 md:py-4 sticky top-0 z-30 border-b border-surface-variant">
    <div class="flex items-center gap-4">
      <span class="text-headline-md font-bold text-primary block md:hidden">NeuralFlow</span>
      
      <!-- Search Input -->
      <div class="relative hidden sm:block">
        <Icon name="material-symbols:search" class="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tasks..."
          class="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright w-64 transition-all"
        />
      </div>
    </div>

    <nav class="hidden md:flex gap-6 items-center">
      <NuxtLink to="/execute" class="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 px-3 py-1 rounded-md">
        Focus Mode
      </NuxtLink>
    </nav>

    <div class="flex items-center gap-3">
      <!-- Document Picture-in-Picture Focus Anchor Trigger -->
      <button
        v-if="isSupported"
        @click="togglePiP()"
        class="flex items-center gap-2 px-3 py-1.5 bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary-container transition-colors duration-200 shadow-sm"
        :class="{ 'bg-secondary text-on-secondary': pipWindow }"
        title="Open Always-on-Top Floating Focus Anchor (Picture-in-Picture)"
      >
        <Icon name="material-symbols:picture-in-picture-alt" class="text-[18px]" />
        <span>{{ pipWindow ? 'Close PiP Anchor' : 'PiP Focus Anchor' }}</span>
      </button>

      <!-- Distraction Dump Trigger -->
      <button
        @click="focusStore.toggleDistractionDump()"
        class="flex items-center gap-2 px-3 py-1.5 border border-outline rounded-lg text-primary font-label-md hover:bg-surface-container-low transition-colors duration-200"
        title="Instant Distraction Dump (Shortcut: Alt + D or Ctrl + K)"
      >
        <Icon name="material-symbols:add-circle" class="text-[18px]" />
        <span class="hidden sm:inline">Distraction Dump</span>
        <span class="text-[10px] font-mono px-1.5 py-0.5 bg-surface-container-high text-outline rounded border border-surface-variant">Alt+D</span>
      </button>

      <button aria-label="Notifications" class="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors duration-200 flex items-center justify-center">
        <Icon name="material-symbols:notifications" class="text-[24px]" />
      </button>

      <button aria-label="Settings" class="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors duration-200 flex items-center justify-center">
        <Icon name="material-symbols:settings" class="text-[24px]" />
      </button>

      <!-- User Profile Avatar & Badge -->
      <div class="flex items-center gap-2">
        <img
          :src="authStore.user?.avatarUrl"
          :alt="authStore.user?.name || 'User Profile'"
          class="w-9 h-9 rounded-full border border-outline-variant object-cover cursor-pointer hover:opacity-90"
        />
        <span v-if="authStore.user?.isGuest" class="hidden lg:inline-block text-[11px] px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full font-semibold">
          GUEST
        </span>
      </div>
    </div>
  </header>
</template>
