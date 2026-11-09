<script setup lang="ts">
import { useFocusStore } from '~/stores/useFocusStore'
import AppToast from '~/components/ui/AppToast.vue'
import AppTaskDetailModal from '~/components/ui/AppTaskDetailModal.vue'
import MobilePrioritySwipeModal from '~/components/features/prep/MobilePrioritySwipeModal.vue'
import FocusCatCompanion from '~/components/features/companion/FocusCatCompanion.vue'

const focusStore = useFocusStore()
useRealtimeSync()

const tabTitle = computed(() => {
  const taskTitle = focusStore.activeTaskTitle.trim()

  if (focusStore.mode === 'work') {
    if (focusStore.isRunning) {
      return `⏳ ${focusStore.formattedTime} - ${taskTitle || 'No task'}`
    } else if (focusStore.elapsedSeconds > 0) {
      return `⏸️ ${focusStore.formattedTime} - ${taskTitle || 'No task'}`
    } else {
      // Without a selected task, fall back to the plain app name instead of
      // repeating it ("NeuralFlow - NeuralFlow").
      return taskTitle ? `🎯 ${taskTitle} - NeuralFlow` : 'NeuralFlow'
    }
  } else if (focusStore.mode === 'shortBreak' || focusStore.mode === 'longBreak') {
    if (focusStore.isRunning) {
      return `☕ ${focusStore.formattedTime} - Break Time`
    } else {
      return `☕ Break Time - NeuralFlow`
    }
  }

  return 'NeuralFlow - Healing Brain'
})

useHead({
  title: tabTitle
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppToast />
  <AppTaskDetailModal />
  <MobilePrioritySwipeModal />
  <FocusCatCompanion />
</template>
