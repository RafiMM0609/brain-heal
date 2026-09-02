<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

interface Props {
  isOpen: boolean
  title?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function handleClose() {
  emit('close')
}

const keyboardHeight = ref(0)
const maxModalHeight = ref<string | undefined>(undefined)

function updateViewport() {
  if (typeof window === 'undefined' || !window.visualViewport) return

  const vv = window.visualViewport
  // Calculate soft keyboard height
  const kh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
  keyboardHeight.value = kh

  if (kh > 0) {
    // When keyboard is visible, constrain modal max-height to visual viewport height
    maxModalHeight.value = `${Math.max(180, vv.height - 16)}px`
  } else {
    maxModalHeight.value = undefined
  }
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewport)
    window.visualViewport.addEventListener('scroll', updateViewport)
    updateViewport()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.removeEventListener('resize', updateViewport)
    window.visualViewport.removeEventListener('scroll', updateViewport)
  }
})

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        updateViewport()
      })
    }
  }
)
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="sheet">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-primary/40 backdrop-blur-sm transition-[padding] duration-150 ease-out"
          :style="{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : undefined }"
          @click.self="handleClose"
        >
          <div
            class="bg-surface rounded-t-2xl sm:rounded-xl border border-surface-variant shadow-2xl max-w-lg w-full overflow-hidden flex flex-col transform transition-all pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pb-0 max-h-[90vh] sm:max-h-[80vh]"
            :style="{ maxHeight: maxModalHeight }"
          >
            <!-- Mobile Bottom Sheet Drag Handle -->
            <div class="w-12 h-1.5 bg-outline/30 rounded-full mx-auto my-2 block sm:hidden shrink-0" />

            <!-- Header -->
            <div v-if="title || $slots.header" class="flex justify-between items-center px-5 sm:px-6 py-3 sm:py-4 border-b border-surface-variant shrink-0">
              <h3 v-if="title" class="text-headline-md font-semibold text-primary">
                {{ title }}
              </h3>
              <slot name="header" />
              <button
                @click="handleClose"
                class="text-outline hover:text-primary transition-colors p-1 rounded-md"
              >
                <Icon name="material-symbols:close" class="text-[20px]" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-5 sm:p-6 overflow-y-auto flex-1 pb-safe">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="px-5 sm:px-6 py-3 sm:py-4 bg-surface-container-low border-t border-surface-variant flex justify-end gap-3 shrink-0 pb-safe">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .sheet-enter-from,
  .sheet-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
