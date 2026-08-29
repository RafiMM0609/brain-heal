<script setup lang="ts">
import { useFocusStore } from '~/stores/useFocusStore'
import { useDistractionStore } from '~/stores/useDistractionStore'
import AppModal from '~/components/ui/AppModal.vue'

const focusStore = useFocusStore()
const distractionStore = useDistractionStore()
const distractionText = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const justSaved = ref(false)

function triggerHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(15)
    } catch {
      // Ignore if not supported or disallowed by browser policy
    }
  }
}

watch(
  () => focusStore.isDistractionDumpOpen,
  (isOpen) => {
    if (isOpen) {
      const doFocus = () => {
        const el = inputRef.value || (document.getElementById('instant-dump-input') as HTMLInputElement | null)
        if (el) {
          el.focus()
        }
      }
      doFocus()
      nextTick(doFocus)
      requestAnimationFrame(doFocus)
      setTimeout(doFocus, 50)
    } else {
      distractionText.value = ''
      justSaved.value = false
    }
  }
)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleSave()
  }
}

function handleSave() {
  const text = distractionText.value.trim()
  if (!text) return

  distractionStore.addDistraction(text)
  distractionText.value = ''
  justSaved.value = true
  triggerHaptic()

  setTimeout(() => {
    focusStore.isDistractionDumpOpen = false
  }, 400)
}
</script>

<template>
  <AppModal
    :isOpen="focusStore.isDistractionDumpOpen"
    title="Instant Distraction Dump"
    @close="focusStore.isDistractionDumpOpen = false"
  >
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-body-md text-on-surface-variant leading-relaxed">
          Dump intrusive thoughts instantly to protect working memory.
        </p>
        <span class="hidden sm:inline-block text-[11px] font-mono bg-surface-container-high text-outline px-2 py-1 rounded border border-surface-variant shrink-0">
          Alt + D / Ctrl + K
        </span>
      </div>

      <div class="relative">
        <form @submit.prevent="handleSave" class="flex gap-2">
          <input
            id="instant-dump-input"
            ref="inputRef"
            v-model="distractionText"
            type="text"
            autofocus
            enterkeyhint="send"
            autocomplete="off"
            @keydown="handleKeydown"
            placeholder="Type intrusive thought & press Enter..."
            class="flex-1 px-4 py-3.5 bg-surface-container-low border border-surface-variant rounded-xl text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            :disabled="!distractionText.trim()"
            class="px-4 py-3.5 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
            title="Dump Thought"
          >
            <Icon name="material-symbols:send" class="text-[20px]" />
          </button>
        </form>

        <div
          v-if="justSaved"
          class="absolute inset-0 bg-primary-container/95 text-on-primary-container rounded-xl flex items-center justify-center font-bold text-sm transition-all z-10 shadow-lg"
        >
          <Icon name="material-symbols:check-circle" class="text-[22px] mr-2 text-primary" />
          Dumped to Working Memory! Resuming focus...
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-outline">
        <span>Tekan <kbd class="px-1.5 py-0.5 bg-surface-container-high rounded font-mono">Enter</kbd> / <kbd class="px-1.5 py-0.5 bg-surface-container-high rounded font-mono">Send</kbd> untuk simpan</span>
        <span class="text-[11px]">⚡ Instant Dump</span>
      </div>

      <!-- List of recent distraction logs -->
      <div v-if="distractionStore.distractions.length > 0" class="pt-4 border-t border-surface-variant">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-label-sm uppercase font-semibold text-outline">Logged Distractions in Session</h4>
          <button
            @click="distractionStore.clearAllDistractions()"
            class="text-xs text-error hover:underline font-medium flex items-center gap-1"
            title="Clear all distractions"
          >
            <Icon name="material-symbols:delete-sweep" class="text-[14px]" /> Clear All
          </button>
        </div>
        <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
          <div
            v-for="item in distractionStore.distractions"
            :key="item.id"
            class="p-3 bg-surface-container-lowest rounded-lg border border-surface-variant flex items-center justify-between text-sm text-on-surface group"
          >
            <span class="truncate flex-1 mr-2">{{ item.content }}</span>
            <div class="flex items-center gap-2 shrink-0">
              <button
                v-if="!item.convertedToTask"
                @click="distractionStore.convertToTask(item.id)"
                class="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <Icon name="material-symbols:add-task" class="text-[14px]" /> Convert to Task
              </button>
              <span v-else class="text-xs text-secondary font-medium flex items-center gap-1">
                <Icon name="material-symbols:check" class="text-[14px]" /> In Inbox
              </span>
              <button
                @click="distractionStore.deleteDistraction(item.id)"
                class="text-outline hover:text-error transition-colors p-1 rounded"
                title="Delete distraction"
              >
                <Icon name="material-symbols:delete" class="text-[16px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppModal>
</template>

