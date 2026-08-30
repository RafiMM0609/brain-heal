<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toastState, hideToast } = useToast()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-6 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100 scale-100"
      leave-to-class="transform translate-y-6 opacity-0 scale-95"
    >
      <div
        v-if="toastState"
        @click="hideToast"
        class="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] max-w-[92vw] sm:max-w-md w-auto px-4 py-3 bg-slate-900/95 dark:bg-slate-100/95 text-slate-100 dark:text-slate-900 rounded-2xl shadow-2xl border border-slate-700/70 dark:border-slate-300/70 backdrop-blur-md flex items-center gap-3 cursor-pointer select-none"
        role="alert"
        aria-live="polite"
      >
        <div class="p-2 bg-primary/20 text-primary rounded-xl shrink-0 flex items-center justify-center">
          <Icon name="material-symbols:content-copy" class="text-[20px]" />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-slate-100 dark:text-slate-900 leading-snug break-words">
            {{ toastState.message }}
          </p>
        </div>

        <button
          @click.stop="hideToast"
          class="text-slate-400 hover:text-slate-200 dark:text-slate-500 dark:hover:text-slate-800 p-1 rounded-lg transition-colors shrink-0"
          aria-label="Tutup Notifikasi"
        >
          <Icon name="material-symbols:close" class="text-[18px]" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
