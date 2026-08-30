<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toastState, hideToast } = useToast()
const toast = computed(() => toastState.value)
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-6 opacity-0 scale-95"
        enter-to-class="transform translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100 scale-100"
        leave-to-class="transform -translate-y-6 opacity-0 scale-95"
      >
        <div
          v-if="toast"
          @click="hideToast"
          class="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-[92vw] sm:max-w-lg w-auto px-5 py-3.5 bg-slate-900/95 text-slate-100 rounded-2xl shadow-2xl border border-primary/50 backdrop-blur-md flex items-center gap-3 cursor-pointer select-none"
          role="alert"
          aria-live="polite"
        >
          <div class="p-2 bg-primary/20 text-primary rounded-xl shrink-0 flex items-center justify-center">
            <Icon name="material-symbols:check-circle" class="text-[22px]" />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white leading-snug break-words">
              {{ toast.message }}
            </p>
          </div>

          <button
            @click.stop="hideToast"
            class="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors shrink-0"
            aria-label="Tutup Notifikasi"
          >
            <Icon name="material-symbols:close" class="text-[18px]" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
