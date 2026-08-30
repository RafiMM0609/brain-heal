<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'
import { useFocusStore } from '~/stores/useFocusStore'
import { useDocumentPiP } from '~/composables/useDocumentPiP'

const authStore = useAuthStore()
const focusStore = useFocusStore()
const router = useRouter()
const { pipWindow, isSupported, togglePiP } = useDocumentPiP()
const { requestNotificationPermission } = useAudioNotification()
const searchQuery = ref('')

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/', query: { search: searchQuery.value.trim() } })
  }
}

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
</script>

<template>
  <header class="bg-surface/95 backdrop-blur-md shadow-xs flex justify-between items-center w-full px-4 py-3 pt-safe md:px-8 md:py-4 sticky top-0 z-30 border-b border-surface-variant">
    <div class="flex items-center gap-4">
      <span class="text-headline-md font-bold text-primary block md:hidden">NeuralFlow</span>
      
      <!-- Search Input -->
      <div class="relative hidden sm:block">
        <Icon name="material-symbols:search" class="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]" />
        <input
          v-model="searchQuery"
          @keydown.enter="handleSearch"
          type="text"
          placeholder="Search tasks..."
          class="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright w-64 transition-all"
        />
      </div>
    </div>

    <nav class="hidden md:flex gap-6 items-center">
      <NuxtLink to="/execute" class="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 px-3 py-1 rounded-md">
        Focus Mode
      </NuxtLink>
    </nav>

    <div class="flex items-center gap-3">
      <!-- Document Picture-in-Picture Focus Anchor Trigger -->
      <button
        v-if="isSupported"
        @click="togglePiP()"
        class="flex items-center gap-2 px-3 py-1.5 bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary-container transition-colors duration-200 shadow-sm"
        :class="{ 'bg-secondary text-on-secondary': pipWindow }"
        title="Open Always-on-Top Floating Focus Anchor (Picture-in-Picture)"
      >
        <Icon name="material-symbols:picture-in-picture-alt" class="text-[18px]" />
        <span>{{ pipWindow ? 'Close PiP Anchor' : 'PiP Focus Anchor' }}</span>
      </button>

      <!-- Distraction Dump Trigger -->
      <button
        @click="focusStore.toggleDistractionDump()"
        class="flex items-center gap-2 px-3 py-1.5 border border-outline rounded-lg text-primary font-label-md hover:bg-surface-container-low transition-colors duration-200"
        title="Instant Distraction Dump (Shortcut: Alt + D or Ctrl + K)"
      >
        <Icon name="material-symbols:add-circle" class="text-[18px]" />
        <span class="hidden sm:inline">Distraction Dump</span>
        <span class="text-[10px] font-mono px-1.5 py-0.5 bg-surface-container-high text-outline rounded border border-surface-variant">Alt+D</span>
      </button>

      <button
        @click="requestNotificationPermission"
        aria-label="Notifications"
        title="Enable Push Notifications"
        class="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors duration-200 flex items-center justify-center"
      >
        <Icon name="material-symbols:notifications" class="text-[24px]" />
      </button>

      <button
        @click="focusStore.toggleDistractionDump"
        aria-label="Settings"
        title="Open Distraction Dump Settings"
        class="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors duration-200 flex items-center justify-center"
      >
        <Icon name="material-symbols:settings" class="text-[24px]" />
      </button>

      <!-- User Profile Avatar & Badge / Name Dropdown Trigger -->
      <div ref="profileMenuRef" class="relative">
        <button
          @click.stop="toggleProfileMenu"
          class="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-container-low transition-all border border-transparent hover:border-surface-variant focus:outline-none"
          :class="{ 'bg-surface-container-low border-surface-variant': isProfileMenuOpen }"
          title="Profile Menu"
          :aria-expanded="isProfileMenuOpen"
        >
          <img
            :src="authStore.user?.avatarUrl"
            :alt="authStore.user?.name || 'User Profile'"
            class="w-9 h-9 rounded-full border border-outline-variant object-cover"
          />
          <span v-if="authStore.user?.isGuest" class="hidden lg:inline-block text-[11px] px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full font-semibold uppercase tracking-wider">
            GUEST
          </span>
          <span v-else-if="authStore.user?.name" class="hidden sm:inline-block text-sm font-semibold text-on-surface max-w-[140px] truncate">
            {{ authStore.user.name }}
          </span>
          <Icon name="material-symbols:keyboard-arrow-down" class="text-[18px] text-on-surface-variant transition-transform duration-200" :class="{ 'rotate-180': isProfileMenuOpen }" />
        </button>

        <!-- Profile Dropdown Menu -->
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
            class="absolute right-0 top-full mt-2 w-72 bg-surface-bright/95 backdrop-blur-md rounded-2xl border border-surface-variant shadow-2xl z-50 p-4 overflow-hidden"
          >
            <!-- User Info Header -->
            <div class="flex items-center gap-3 pb-3 border-b border-surface-variant">
              <img
                :src="authStore.user?.avatarUrl"
                :alt="authStore.user?.name || 'User Profile'"
                class="w-12 h-12 rounded-full border-2 border-primary/20 object-cover shrink-0"
              />
              <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <h4 class="text-sm font-bold text-on-surface truncate">
                    {{ authStore.user?.name || 'Guest User' }}
                  </h4>
                  <span v-if="authStore.user?.isGuest" class="text-[9px] px-1.5 py-0.5 bg-primary-fixed text-on-primary-fixed rounded font-bold uppercase shrink-0">
                    GUEST
                  </span>
                </div>
                <p class="text-xs text-on-surface-variant truncate mt-0.5">
                  {{ authStore.user?.email || (authStore.user?.isGuest ? 'guest@cognitivelab.local' : 'No email set') }}
                </p>
              </div>
            </div>

            <!-- Menu Options -->
            <div class="pt-2 space-y-1">
              <button
                @click="handleLogout"
                class="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-error hover:bg-error-container/20 transition-colors"
              >
                <Icon name="material-symbols:logout" class="text-[20px] text-error" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

