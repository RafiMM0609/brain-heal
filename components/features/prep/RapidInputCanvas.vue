<script setup lang="ts">
import { useTaskStore } from '~/stores/useTaskStore'

const taskStore = useTaskStore()
const inputText = ref('')
const isAnimating = ref(false)

const emit = defineEmits<{
  (e: 'next'): void
}>()

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    if (inputText.value.trim()) {
      taskStore.addTask(inputText.value, 'inbox')
      isAnimating.value = true
      setTimeout(() => {
        isAnimating.value = false
        inputText.value = ''
      }, 150)
    }
  }
}

function removeTask(id: string) {
  taskStore.deleteTask(id)
}
</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-120px)] justify-between">
    <!-- Header -->
    <header class="mb-8">
      <h2 class="text-display-lg font-bold text-on-surface mb-2">Rapid Input</h2>
      <p class="text-body-lg text-on-surface-variant max-w-2xl">
        Offload your working memory. Type a task and press Enter. Don't overthink, just capture to clear cognitive bandwidth.
      </p>
    </header>

    <!-- Main Input Box -->
    <div
      class="bg-surface-container-lowest rounded-xl border border-surface-variant p-8 mb-8 soft-shadow flex-1 flex flex-col relative transition-all duration-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:shadow-md"
      :class="{ 'scale-[0.99]': isAnimating }"
    >
      <div class="flex items-center gap-3 text-outline mb-4">
        <Icon name="material-symbols:keyboard" class="text-[28px]" />
        <span class="text-label-md uppercase tracking-wider text-outline-variant font-semibold">Awaiting Input</span>
      </div>

      <textarea
        v-model="inputText"
        @keydown="handleKeyDown"
        autofocus
        placeholder="What's on your mind?... (e.g. Prepare presentation, fix server bug)"
        class="w-full flex-1 bg-transparent border-none resize-none focus:ring-0 text-headline-lg font-semibold text-on-surface placeholder:text-surface-dim outline-none"
      />

      <div class="absolute bottom-6 right-6 flex items-center gap-2 text-label-sm text-outline-variant">
        <span>Press <kbd class="px-2 py-1 bg-surface-container-low rounded border border-surface-variant text-on-surface-variant font-mono text-xs">Enter</kbd> to add</span>
      </div>
    </div>

    <!-- Quick Capture Preview -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-headline-md font-semibold text-on-surface">Raw Inbox Preview</h3>
        <span class="text-label-md text-outline bg-surface-container-low px-3 py-1 rounded-full font-medium">
          {{ taskStore.rawInbox.length }} Items
        </span>
      </div>

      <div v-if="taskStore.rawInbox.length === 0" class="p-6 text-center border border-dashed border-surface-variant rounded-lg text-outline">
        No raw tasks yet. Type above and press Enter to capture thoughts instantaneously.
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="task in taskStore.rawInbox"
          :key="task.id"
          class="bg-surface-container-lowest border border-surface-variant rounded-lg p-4 flex items-start gap-3 hover:border-primary/30 transition-colors soft-shadow group"
        >
          <div class="w-2.5 h-2.5 rounded-full bg-outline-variant mt-2 group-hover:bg-primary transition-colors shrink-0" />
          <p class="text-body-md text-on-surface flex-1 leading-snug">{{ task.title }}</p>
          <button
            @click="removeTask(task.id)"
            class="text-outline hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-1"
            title="Delete task"
          >
            <Icon name="material-symbols:close" class="text-[18px]" />
          </button>
        </div>
      </div>
    </div>

    <!-- Action Button -->
    <div class="flex justify-end pt-4 border-t border-surface-variant">
      <button
        @click="emit('next')"
        class="bg-primary text-on-primary px-8 py-4 rounded-full text-label-md font-semibold flex items-center gap-3 hover:bg-primary-container hover:text-on-primary-container transition-all soft-shadow group"
      >
        <span>Next: Prioritize Matrix</span>
        <Icon name="material-symbols:arrow-forward" class="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
</template>
