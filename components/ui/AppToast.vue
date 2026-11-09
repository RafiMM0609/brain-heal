<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toastState, hideToast } = useToast()
const toast = computed(() => toastState.value)

/**
 * Audit F-04: the toast ignored its `type` and always rendered a green
 * check-circle, so "Failed to share image" looked like a success. Icon and
 * accent colour now follow the toast type.
 */
const variant = computed(() => {
  switch (toast.value?.type) {
    case 'error':
      return {
        icon: 'material-symbols:error',
        iconClass: 'text-error',
        iconBg: 'bg-error/15',
        border: 'border-error/50'
      }
    case 'warning':
      return {
        icon: 'material-symbols:warning',
        iconClass: 'text-status-warn',
        iconBg: 'bg-status-warn-surface',
        border: 'border-status-warn/50'
      }
    case 'info':
      return {
        icon: 'material-symbols:info',
        iconClass: 'text-primary-fixed',
        iconBg: 'bg-primary/40',
        border: 'border-primary/50'
      }
    default:
      return {
        icon: 'material-symbols:check-circle',
        iconClass: 'text-secondary-fixed-dim',
        iconBg: 'bg-secondary/30',
        border: 'border-secondary/50'
      }
  }
})

async function runAction() {
  const action = toast.value?.action
  if (!action) return
  hideToast()
  await action.run()
}
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
          class="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-[92vw] sm:max-w-lg w-auto px-4 sm:px-5 py-3 bg-slate-900/95 text-slate-100 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 select-none"
          :class="variant.border"
          :role="toast.type === 'error' ? 'alert' : 'status'"
          aria-live="polite"
        >
          <div class="p-2 rounded-xl shrink-0 flex items-center justify-center" :class="[variant.iconBg, variant.iconClass]">
            <Icon :name="variant.icon" class="text-[22px]" aria-hidden="true" />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white leading-snug break-words">
              {{ toast.message }}
            </p>
          </div>

          <button
            v-if="toast.action"
            @click="runAction"
            class="shrink-0 inline-flex items-center gap-1.5 min-h-9 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            <Icon v-if="toast.action.icon" :name="toast.action.icon" class="text-[16px]" aria-hidden="true" />
            <span>{{ toast.action.label }}</span>
          </button>

          <button
            @click="hideToast"
            class="text-slate-400 hover:text-slate-200 rounded-lg transition-colors shrink-0 min-h-9 min-w-9 flex items-center justify-center"
            aria-label="Dismiss notification"
          >
            <Icon name="material-symbols:close" class="text-[18px]" aria-hidden="true" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
