<script setup lang="ts">
import { useFocusStore } from '~/stores/useFocusStore'
import { useDistractionStore } from '~/stores/useDistractionStore'
import AppModal from '~/components/ui/AppModal.vue'

const focusStore = useFocusStore()
const distractionStore = useDistractionStore()
const distractionText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const justSaved = ref(false)

watch(
  () => focusStore.isDistractionDumpOpen,
  (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        textareaRef.value?.focus()
      })
    } else {
      distractionText.value = ''
      justSaved.value = false
    }
  }
)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSave()
  }
}

function handleSave() {
  if (distractionText.value.trim()) {
    distractionStore.addDistraction(distractionText.value)
    distractionText.value = ''
    justSaved.value = true
    setTimeout(() => {
      focusStore.isDistractionDumpOpen = false
    }, 400)
  }
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
        <span class="text-[11px] font-mono bg-surface-container-high text-outline px-2 py-1 rounded border border-surface-variant shrink-0">
          Alt + D / Ctrl + K
        </span>
      </div>

      <div class="relative">
        <textarea
          ref="textareaRef"
          v-model="distractionText"
          @keydown="handleKeydown"
          rows="4"
          placeholder="Type intrusive thought... (e.g. 'Pay electric bill', 'Idea for newsletter') Press Enter to Dump."
          class="w-full p-4 bg-surface-container-low border border-surface-variant rounded-xl text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright outline-none resize-none transition-all"
        />

        <div
          v-if="justSaved"
          class="absolute inset-0 bg-primary-container/90 text-on-primary-container rounded-xl flex items-center justify-center font-bold text-sm transition-all"
        >
          <Icon name="material-symbols:check-circle" class="text-[20px] mr-2" />
          Dumped to Working Memory! Resuming focus...
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-outline">
        <span>Press <kbd class="px-1.5 py-0.5 bg-surface-container-high rounded font-mono">Enter</kbd> to save immediately</span>
        <span>Press <kbd class="px-1.5 py-0.5 bg-surface-container-high rounded font-mono">Shift+Enter</kbd> for newline</span>
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

    <template #footer>
      <button
        @click="focusStore.isDistractionDumpOpen = false"
        class="px-4 py-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium"
      >
        Close
      </button>
      <button
        @click="handleSave"
        class="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary-container transition-colors flex items-center gap-1.5"
      >
        <Icon name="material-symbols:send" class="text-[18px]" />
        <span>Dump Thought</span>
      </button>
    </template>
  </AppModal>
</template>
