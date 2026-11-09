<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'
import { useSidebarState } from '~/composables/useSidebarState'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isCollapsed, toggleSidebar } = useSidebarState()

function navigateToExecute() {
  router.push('/execute')
}

interface NavItem {
  label: string
  to: string
  icon: string
}

const mainNavItems: NavItem[] = [
  { label: 'Prep', to: '/', icon: 'material-symbols:edit-note' },
  { label: 'Execute', to: '/execute', icon: 'material-symbols:bolt' },
  { label: 'Recovery', to: '/recovery', icon: 'material-symbols:self-improvement' },
  { label: 'Media Share', to: '/share', icon: 'material-symbols:content-paste-go' }
]

function isLinkActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav
    aria-label="Primary"
    class="hidden md:flex fixed left-0 top-0 h-screen flex-col z-40 bg-surface-container-low border-r border-outline-variant transition-all duration-300 ease-in-out"
    :class="isCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-6'"
  >
    <!-- Header / Brand (Clicking logo toggles collapse state) -->
    <button
      type="button"
      @click="toggleSidebar"
      class="group flex items-center gap-3 rounded-xl p-2 transition-all hover:bg-surface-container-high relative select-none w-full text-left"
      :class="isCollapsed ? 'justify-center mb-6' : 'mb-6 justify-between'"
      :aria-expanded="!isCollapsed"
      :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
    >
      <div class="flex items-center gap-3 min-w-0">
        <!-- Logo Mark with Hover Indicator -->
        <div class="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform shadow-sm relative">
          <Icon name="material-symbols:psychology" class="text-[22px]" aria-hidden="true" />
          <!-- Hover Icon Overlay indicating collapse/expand action -->
          <div class="absolute inset-0 rounded-full bg-primary/80 text-on-primary opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <Icon :name="isCollapsed ? 'material-symbols:arrow-forward-ios' : 'material-symbols:arrow-back-ios-new'" class="text-[16px]" aria-hidden="true" />
          </div>
        </div>

        <div v-if="!isCollapsed" class="min-w-0 flex-1">
          <h1 class="text-title-md font-bold text-primary truncate">NeuralFlow</h1>
          <p class="text-label-sm text-on-surface-variant truncate">
            {{ authStore.user?.state || 'Relaxed alertness' }}
          </p>
        </div>
      </div>

      <!-- Toggle indicator icon in expanded mode -->
      <div v-if="!isCollapsed" class="text-on-surface-variant shrink-0" aria-hidden="true">
        <Icon name="material-symbols:first-page" class="text-[22px]" />
      </div>
    </button>

    <!-- Quick Action Button -->
    <button
      @click="navigateToExecute"
      class="transition-all duration-200 flex items-center justify-center shadow-sm relative group"
      :class="[
        isCollapsed
          ? 'w-11 h-11 min-w-11 min-h-11 mb-6 bg-primary text-on-primary rounded-xl hover:bg-primary-container hover:scale-105'
          : 'w-full py-3 mb-6 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:bg-primary-container gap-2'
      ]"
      :aria-label="isCollapsed ? 'Start Deep Work' : undefined"
    >
      <Icon name="material-symbols:bolt" :class="isCollapsed ? 'text-[24px]' : 'text-[20px]'" aria-hidden="true" />
      <span v-if="!isCollapsed">Start Deep Work</span>

      <!-- Floating Tooltip for collapsed mode -->
      <div
        v-if="isCollapsed"
        class="absolute left-full ml-3 px-3 py-1.5 bg-surface-bright text-on-surface text-xs font-semibold rounded-lg shadow-xl border border-surface-variant opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50"
      >
        Start Deep Work
      </div>
    </button>

    <!-- Navigation Links -->
    <div class="flex flex-col gap-3 flex-grow w-full" :class="{ 'items-center': isCollapsed }">
      <!-- Expanded Mode -->
      <template v-if="!isCollapsed">
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="item in mainNavItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group min-h-11"
            :class="isLinkActive(item.to) ? 'text-primary font-bold bg-primary-fixed/30' : 'text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-high'"
            :aria-current="isLinkActive(item.to) ? 'page' : undefined"
          >
            <span v-if="isLinkActive(item.to)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full" aria-hidden="true"></span>
            <Icon :name="item.icon" class="text-[24px] shrink-0" aria-hidden="true" />
            <span class="text-label-md">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </template>

      <!-- Collapsed Mode: Render ALL navigation icons -->
      <template v-else>
        <div class="flex flex-col gap-2 items-center w-full">
          <NuxtLink
            v-for="item in mainNavItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center justify-center transition-all duration-200 relative group"
            :class="[
              isLinkActive(item.to)
                ? 'w-11 h-11 rounded-xl bg-primary text-on-primary shadow-md shadow-primary/30 ring-2 ring-primary/40 ring-offset-2 ring-offset-surface-container-low'
                : 'w-11 h-11 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            ]"
            :aria-current="isLinkActive(item.to) ? 'page' : undefined"
            :aria-label="item.label"
          >
            <!-- Left Accent Indicator Bar for Active Icon -->
            <span
              v-if="isLinkActive(item.to)"
              class="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full shadow-md shadow-primary/50"
            ></span>

            <Icon :name="item.icon" class="text-[22px] shrink-0 transition-transform duration-200 group-hover:scale-110" />

            <!-- Floating Tooltip for collapsed mode -->
            <div
              class="absolute left-full ml-3 px-3 py-1.5 bg-surface-bright text-on-surface text-xs font-semibold rounded-lg shadow-xl border border-surface-variant opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 flex items-center gap-2"
            >
              <span>{{ item.label }}</span>
              <span v-if="isLinkActive(item.to)" class="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded font-bold uppercase">Active</span>
            </div>
          </NuxtLink>

        </div>
      </template>
    </div>

    <!-- Footer: collapsed-state hint. Profile lives in the header (Audit C-03). -->
    <div v-if="isCollapsed" class="mt-auto pt-4 border-t border-outline-variant flex flex-col items-center gap-2 w-full">
      <UserAvatar :src="authStore.user?.avatarUrl" :name="authStore.user?.name" size="sm" />
    </div>
  </nav>
</template>
