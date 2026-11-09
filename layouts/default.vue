<script setup lang="ts">
import AppSidebar from '~/components/common/AppSidebar.vue'
import AppHeader from '~/components/common/AppHeader.vue'
import DistractionDumpModal from '~/components/features/focus/DistractionDumpModal.vue'
import MentalClosureModal from '~/components/features/focus/MentalClosureModal.vue'
import StickyFocusHeader from '~/components/common/StickyFocusHeader.vue'
import MobileBottomNav from '~/components/common/MobileBottomNav.vue'
import { useFocusStore } from '~/stores/useFocusStore'

import { useSidebarState } from '~/composables/useSidebarState'

const focusStore = useFocusStore()
const route = useRoute()
const { isCollapsed } = useSidebarState()

function handleGlobalKeydown(e: KeyboardEvent) {
  // Shortcut: Alt + D OR Ctrl/Cmd + K
  const isAltD = e.altKey && (e.key.toLowerCase() === 'd' || e.code === 'KeyD')
  const isCtrlK = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')

  if (isAltD || isCtrlK) {
    e.preventDefault()
    focusStore.openDistractionDump()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  if (route.query.action === 'instant-dump' || route.query.dump === 'true') {
    focusStore.openDistractionDump()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="bg-background text-on-background min-h-screen flex flex-col md:flex-row">
    <!-- Audit A-02: the first tab stop is now a skip link instead of the
         navigation rail, so keyboard users can jump straight to the content. -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-primary focus:text-on-primary focus:font-semibold focus:shadow-xl"
    >
      Skip to main content
    </a>

    <AppSidebar />
    <div
      class="flex-1 flex flex-col min-h-screen overflow-hidden relative transition-all duration-300 ease-in-out"
      :class="isCollapsed ? 'md:ml-20' : 'md:ml-64'"
    >
      <!-- Sticky Top Header Container -->
      <div class="sticky top-0 z-30 w-full shrink-0">
        <StickyFocusHeader />
        <AppHeader />
      </div>
      <main
        id="main-content"
        tabindex="-1"
        class="flex-1 overflow-y-auto px-4 pt-4 pb-24 md:px-8 md:pt-6 md:pb-8 bg-background focus:outline-none"
      >
        <slot />
      </main>

      <!-- Distraction Dump Floating Action Button (FAB) on Mobile -->
      <button
        @click="focusStore.openDistractionDump()"
        class="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 md:hidden w-12 h-12 rounded-full bg-primary text-on-primary shadow-xl flex items-center justify-center active:scale-95 transition-all border-2 border-surface-bright"
        aria-label="Capture a distraction"
      >
        <Icon name="material-symbols:edit-note" class="text-[24px]" aria-hidden="true" />
      </button>

      <!-- Mobile Bottom Navigation Bar -->
      <MobileBottomNav />
    </div>

    <!-- Global Distraction Dump Modal / Bottom Sheet -->
    <DistractionDumpModal />
    <!-- Global Mental Closure Modal -->
    <MentalClosureModal />
  </div>
</template>
