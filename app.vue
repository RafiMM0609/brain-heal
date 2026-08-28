<script setup lang="ts">
import { useFocusStore } from '~/stores/useFocusStore'

const focusStore = useFocusStore()

function updateTabTitle() {
  if (import.meta.server || typeof document === 'undefined') return

  const taskTitle = focusStore.activeTaskTitle || 'NeuralFlow'

  if (focusStore.mode === 'work') {
    if (focusStore.isRunning) {
      document.title = `⏳ ${focusStore.formattedTime} - ${taskTitle}`
    } else if (focusStore.elapsedSeconds > 0) {
      document.title = `⏸️ ${focusStore.formattedTime} - ${taskTitle}`
    } else {
      document.title = `🎯 ${taskTitle} - NeuralFlow`
    }
  } else if (focusStore.mode === 'shortBreak' || focusStore.mode === 'longBreak') {
    if (focusStore.isRunning) {
      document.title = `☕ ${focusStore.formattedTime} - Break Time`
    } else {
      document.title = `☕ Break Time - NeuralFlow`
    }
  } else {
    document.title = 'NeuralFlow - Healing Brain'
  }
}

watch(
  [
    () => focusStore.formattedTime,
    () => focusStore.isRunning,
    () => focusStore.mode,
    () => focusStore.activeTaskTitle
  ],
  () => {
    updateTabTitle()
  },
  { immediate: true }
)

onMounted(() => {
  updateTabTitle()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
