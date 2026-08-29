<script setup lang="ts">
import AppSidebar from '~/components/common/AppSidebar.vue'
import AppHeader from '~/components/common/AppHeader.vue'
import DistractionDumpModal from '~/components/features/focus/DistractionDumpModal.vue'
import StickyFocusHeader from '~/components/common/StickyFocusHeader.vue'
import MobileBottomNav from '~/components/common/MobileBottomNav.vue'
import { useFocusStore } from '~/stores/useFocusStore'

const focusStore = useFocusStore()
const route = useRoute()

function handleGlobalKeydown(e: KeyboardEvent) {
  // Shortcut: Alt + D OR Ctrl/Cmd + K
  const isAltD = e.altKey && (e.key.toLowerCase() === 'd' || e.code === 'KeyD')
  const isCtrlK = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')

  if (isAltD || isCtrlK) {
    e.preventDefault()
    focusStore.isDistractionDumpOpen = !focusStore.isDistractionDumpOpen
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  if (route.query.action === 'instant-dump' || route.query.dump === 'true') {
    focusStore.isDistractionDumpOpen = true
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="bg-background text-on-background min-h-screen flex flex-col md:flex-row">
    <AppSidebar />
    <div class="flex-1 md:ml-64 flex flex-col min-h-screen overflow-hidden relative">
      <!-- Dynamic Island Sticky Top Bar on Mobile -->
      <StickyFocusHeader />
      <AppHeader />
      <main class="flex-1 overflow-y-auto p-4 md:p-8 bg-background pb-24 md:pb-8">
        <slot />
      </main>

      <!-- Distraction Dump Floating Action Button (FAB) on Mobile -->
      <button
        @click="focusStore.isDistractionDumpOpen = true"
        class="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] right-4 z-40 md:hidden w-12 h-12 rounded-full bg-primary text-on-primary shadow-xl flex items-center justify-center active:scale-95 transition-all border-2 border-surface-bright"
        title="Distraction Dump"
        aria-label="Distraction Dump"
      >
        <Icon name="material-symbols:edit-note" class="text-[24px]" />
      </button>

      <!-- Mobile Bottom Navigation Bar -->
      <MobileBottomNav />
    </div>

    <!-- Global Distraction Dump Modal / Bottom Sheet -->
    <DistractionDumpModal />
  </div>
</template>
