<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'
import { useSidebarState } from '~/composables/useSidebarState'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isCollapsed, toggleSidebar } = useSidebarState()

const isProfileMenuOpen = ref(false)
const profileMenuRef = ref<HTMLElement | null>(null)

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value
}

function closeProfileMenu() {
  isProfileMenuOpen.value = false
}

function handleLogout() {
  closeProfileMenu()
  authStore.logout()
  router.push('/login')
}

function handleClickOutside(event: MouseEvent) {
  if (profileMenuRef.value && !profileMenuRef.value.contains(event.target as Node)) {
    isProfileMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

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

const secondaryNavItems: NavItem[] = [
  { label: 'Insights', to: '/insights', icon: 'material-symbols:monitoring' }
]

const allNavItems = [...mainNavItems, ...secondaryNavItems]

function isLinkActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const visibleNavItems = computed(() => {
  if (!isCollapsed.value) {
    return allNavItems
  }
  // When collapsed, show ONLY the active navigation icon
  const active = allNavItems.filter(item => isLinkActive(item.to))
  // Fallback if no specific route matches (e.g. login) so sidebar isn't empty
  return active.length > 0 ? active : allNavItems
})
</script>

<template>
  <nav
    class="hidden md:flex fixed left-0 top-0 h-screen flex-col z-40 bg-surface-container-low border-r border-outline-variant transition-all duration-300 ease-in-out"
    :class="isCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-6'"
  >
    <!-- Header / Brand (Clicking logo toggles collapse state) -->
    <div
      @click="toggleSidebar"
      class="flex items-center gap-3 cursor-pointer group rounded-xl p-2 transition-all hover:bg-surface-container-high relative select-none w-full"
      :class="isCollapsed ? 'justify-center mb-6' : 'mb-6 justify-between'"
      :title="isCollapsed ? 'Klik untuk memperluas sidebar' : 'Klik logo untuk ciutkan sidebar'"
    >
      <div class="flex items-center gap-3 min-w-0">
        <!-- Logo Image Container with Hover Indicator -->
        <div class="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 group-hover:scale-105 transition-transform shadow-sm relative">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAao3QwwHMAM-b6FMmuzfoxU-svHKJMDadY4C5JBpTlJ9IfLBQjbY5aKCGL3JRMTNuDOTsp4S9SOPkTqAJLAU-jirtIlATQcalX2zIu6PRFE5G9Wub6JQDxwoKX-aYxW8JAtUk4hPkBj4J0ISqqxD8srXZjJqONMOJIPF9H1etGLkHY5ZesiCnWHX-6XLXBYgebT36KxSYfqTwButT_k5xPPY3T8Yy-KAtdYQQh2GXmFXADdRONhEKe"
            alt="Cognitive Lab Logo"
            class="w-full h-full object-cover"
          />
          <!-- Hover Icon Overlay indicating collapse/expand action -->
          <div class="absolute inset-0 bg-primary/80 text-on-primary opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <Icon :name="isCollapsed ? 'material-symbols:arrow-forward-ios' : 'material-symbols:arrow-back-ios-new'" class="text-[16px]" />
          </div>
        </div>

        <div v-if="!isCollapsed" class="min-w-0 flex-1">
          <h1 class="text-headline-md font-bold text-primary truncate">Cognitive Lab</h1>
          <p class="text-label-sm text-on-surface-variant truncate">
            {{ authStore.user?.state || 'Relaxed Alertness' }}
          </p>
        </div>
      </div>

      <!-- Toggle indicator icon in expanded mode -->
      <div v-if="!isCollapsed" class="text-on-surface-variant group-hover:text-primary transition-colors">
        <Icon name="material-symbols:first-page" class="text-[22px]" />
      </div>
    </div>

    <!-- Quick Action Button -->
    <button
      @click="navigateToExecute"
      class="transition-all duration-200 flex items-center justify-center shadow-sm relative group"
      :class="[
        isCollapsed
          ? 'w-12 h-12 mb-6 bg-primary text-on-primary rounded-xl hover:bg-primary-container hover:scale-105'
          : 'w-full py-3 mb-6 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:bg-primary-container gap-2'
      ]"
      :title="isCollapsed ? 'Start Deep Work' : undefined"
    >
      <Icon name="material-symbols:bolt" :class="isCollapsed ? 'text-[24px]' : 'text-[20px]'" />
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
      <!-- Expanded Mode: Render separated Main & Secondary Sections -->
      <template v-if="!isCollapsed">
        <div class="flex flex-col gap-2">
          <NuxtLink
            v-for="item in mainNavItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group"
            :class="isLinkActive(item.to) ? 'text-primary font-bold bg-primary-fixed/30' : 'text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-high'"
          >
            <span v-if="isLinkActive(item.to)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full"></span>
            <Icon :name="item.icon" class="text-[24px] shrink-0" />
            <span class="text-label-md">{{ item.label }}</span>
          </NuxtLink>
        </div>

        <div class="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-2">
          <NuxtLink
            v-for="item in secondaryNavItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group"
            :class="isLinkActive(item.to) ? 'text-primary font-bold bg-primary-fixed/30' : 'text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-high'"
          >
            <span v-if="isLinkActive(item.to)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full"></span>
            <Icon :name="item.icon" class="text-[24px] shrink-0" />
            <span class="text-label-md">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </template>

      <!-- Collapsed Mode: Render ONLY Active Icon(s) with prominent Active Marker -->
      <template v-else>
        <div class="flex flex-col gap-4 items-center w-full my-auto">
          <NuxtLink
            v-for="item in visibleNavItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center justify-center transition-all duration-300 relative group"
            :class="[
              isLinkActive(item.to)
                ? 'w-12 h-12 rounded-xl bg-primary text-on-primary shadow-lg shadow-primary/30 scale-110 ring-2 ring-primary/40 ring-offset-2 ring-offset-surface-container-low'
                : 'w-10 h-10 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            ]"
          >
            <!-- Left Accent Indicator Bar for Active Icon -->
            <span
              v-if="isLinkActive(item.to)"
              class="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full shadow-lg shadow-primary/50"
            ></span>

            <!-- Pulsing Active Dot on top-right of active icon -->
            <span v-if="isLinkActive(item.to)" class="absolute -top-1 -right-1 flex h-3 w-3 z-10">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-surface-container-low"></span>
            </span>

            <Icon :name="item.icon" class="text-[24px] shrink-0 transition-transform duration-200 group-hover:scale-110" />

            <!-- Active Indicator Tooltip -->
            <div class="absolute left-full ml-3 px-3 py-1.5 bg-surface-bright text-on-surface text-xs font-semibold rounded-lg shadow-xl border border-surface-variant opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 flex items-center gap-2">
              <span>{{ item.label }}</span>
              <span v-if="isLinkActive(item.to)" class="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded font-bold uppercase">Active</span>
            </div>
          </NuxtLink>
        </div>
      </template>
    </div>

    <!-- Secondary Links / Profile Section at bottom -->
    <div
      class="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-2 relative w-full"
      :class="{ 'items-center': isCollapsed }"
    >
      <!-- User Profile Trigger & Dropdown Menu -->
      <div ref="profileMenuRef" class="relative w-full" :class="{ 'flex justify-center': isCollapsed }">
        <button
          @click.stop="toggleProfileMenu"
          class="flex items-center transition-all border border-transparent focus:outline-none relative group"
          :class="[
            isCollapsed
              ? 'w-10 h-10 rounded-xl justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
              : 'justify-between w-full px-4 py-3 rounded-xl text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-high',
            { 'text-primary bg-surface-container-high border-surface-variant': isProfileMenuOpen }
          ]"
          :title="isCollapsed ? 'Profile' : undefined"
          :aria-expanded="isProfileMenuOpen"
        >
          <div class="flex items-center gap-3 min-w-0" :class="{ 'justify-center': isCollapsed }">
            <Icon name="material-symbols:account-circle" class="text-[24px] shrink-0" />
            <span v-if="!isCollapsed" class="text-label-md truncate">Profile</span>
          </div>
          <Icon v-if="!isCollapsed" name="material-symbols:keyboard-arrow-up" class="text-[18px] text-on-surface-variant transition-transform duration-200" :class="{ 'rotate-180': isProfileMenuOpen }" />

          <!-- Tooltip in collapsed mode -->
          <div
            v-if="isCollapsed"
            class="absolute left-full ml-3 px-3 py-1.5 bg-surface-bright text-on-surface text-xs font-semibold rounded-lg shadow-xl border border-surface-variant opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50"
          >
            Profile
          </div>
        </button>

        <!-- Popover Dropdown Menu -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="isProfileMenuOpen"
            class="absolute bg-surface-bright/95 backdrop-blur-md rounded-2xl border border-surface-variant shadow-2xl z-50 p-4 overflow-hidden"
            :class="[
              isCollapsed
                ? 'left-full bottom-0 ml-3 w-64'
                : 'bottom-full left-0 mb-2 w-full'
            ]"
          >
            <!-- User Info Header -->
            <div class="flex items-center gap-3 pb-3 border-b border-surface-variant">
              <img
                :src="authStore.user?.avatarUrl"
                :alt="authStore.user?.name || 'User Profile'"
                class="w-10 h-10 rounded-full border-2 border-primary/20 object-cover shrink-0"
              />
              <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <h4 class="text-xs font-bold text-on-surface truncate">
                    {{ authStore.user?.name || 'Guest User' }}
                  </h4>
                  <span v-if="authStore.user?.isGuest" class="text-[8px] px-1.5 py-0.2 bg-primary-fixed text-on-primary-fixed rounded font-bold uppercase shrink-0">
                    GUEST
                  </span>
                </div>
                <p class="text-[11px] text-on-surface-variant truncate mt-0.5">
                  {{ authStore.user?.email || (authStore.user?.isGuest ? 'guest@cognitivelab.local' : 'No email set') }}
                </p>
              </div>
            </div>

            <!-- Menu Options -->
            <div class="pt-2 space-y-1">
              <button
                @click="handleLogout"
                class="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-error hover:bg-error-container/20 transition-colors"
              >
                <Icon name="material-symbols:logout" class="text-[18px] text-error" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>
