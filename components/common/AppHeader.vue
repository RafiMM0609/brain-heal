<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'
import { useDocumentPiP } from '~/composables/useDocumentPiP'
import MobileDrawerMenu from '~/components/common/MobileDrawerMenu.vue'

import { useUpstashStatus } from '~/composables/useUpstashStatus'
import { useCatCompanion } from '~/composables/useCatCompanion'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { pipWindow, isSupported, togglePiP } = useDocumentPiP()
const { requestNotificationPermission } = useAudioNotification()
const { isConnected: isRedisConnected, latency: redisLatency } = useUpstashStatus()
const { settings: companionSettings } = useCatCompanion()
const { isDark, toggle: toggleColorMode } = useColorMode()

const isProfileMenuOpen = ref(false)
const isMobileDrawerOpen = ref(false)
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
  <header
    class="bg-surface/95 backdrop-blur-md shadow-xs flex justify-between items-center w-full px-3 sm:px-4 py-2 md:px-6 min-h-12 h-auto border-b border-surface-variant transition-all"
    :class="route.path === '/execute' ? 'pt-safe' : 'md:pt-safe'"
  >
    <div class="flex items-center gap-2.5">
      <!-- Burger Icon Trigger for Mobile View & PWA -->
      <button
        @click="isMobileDrawerOpen = true"
        class="p-2 min-h-11 min-w-11 text-on-surface hover:text-primary hover:bg-surface-container-high rounded-xl transition-all active:scale-95 md:hidden flex items-center justify-center border border-surface-variant/60"
        aria-label="Open menu"
      >
        <Icon name="material-symbols:menu" class="text-[22px]" aria-hidden="true" />
      </button>
      <span class="text-title-md font-bold text-primary block md:hidden truncate">NeuralFlow</span>
    </div>

    <nav class="hidden md:flex gap-6 items-center">
      <NuxtLink to="/execute" class="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 px-3 py-1 rounded-md text-xs">
        Focus Mode
      </NuxtLink>
    </nav>

    <div class="flex items-center gap-1.5 sm:gap-2">
      <!-- Document Picture-in-Picture Focus Anchor Trigger -->
      <button
        v-if="isSupported"
        @click="togglePiP()"
        class="p-2 min-h-11 min-w-11 text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-full transition-colors duration-200 flex items-center justify-center"
        :class="{ 'bg-secondary/20 text-secondary': pipWindow }"
        :aria-pressed="!!pipWindow"
        aria-label="Open floating focus window (Picture-in-Picture)"
      >
        <Icon name="material-symbols:picture-in-picture-alt" class="text-[20px]" aria-hidden="true" />
      </button>

      <!-- Upstash Cloud Sync Status Badge -->
      <div
        class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all"
        :class="isRedisConnected ? 'bg-status-online-surface border-status-online/40 text-status-online' : 'bg-status-warn-surface border-status-warn/40 text-status-warn'"
        :title="isRedisConnected ? `Upstash Redis Connected (${redisLatency !== null ? redisLatency + 'ms latency' : 'active'})` : 'Upstash disconnected (local memory fallback)'"
      >
        <span
          class="w-2 h-2 rounded-full transition-colors"
          :class="isRedisConnected ? 'bg-status-online' : 'bg-status-warn'"
        />
        <span class="text-[11px] font-semibold">
          {{ isRedisConnected ? 'Synced' : 'Offline' }}
        </span>
      </div>

      <!-- Focus Cat Companion Quick Trigger -->
      <button
        @click="companionSettings.enabled = !companionSettings.enabled"
        class="p-2 min-h-11 min-w-11 text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-full transition-colors duration-200 flex items-center justify-center relative group"
        :class="{ 'bg-primary/10 text-primary': companionSettings.enabled }"
        :title="companionSettings.enabled ? `Focus companion (${companionSettings.name}) active` : 'Enable focus companion'"
        :aria-pressed="companionSettings.enabled"
        aria-label="Toggle focus companion"
      >
        <Icon name="material-symbols:pets" class="text-[20px]" aria-hidden="true" />
        <span
          v-if="companionSettings.enabled"
          class="absolute top-1 right-1 w-2 h-2 rounded-full bg-status-online ring-2 ring-surface"
          aria-hidden="true"
        />
      </button>

      <!-- Colour scheme toggle (Audit C-01) -->
      <button
        @click="toggleColorMode"
        class="p-2 min-h-11 min-w-11 text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-full transition-colors duration-200 flex items-center justify-center"
        :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        :aria-pressed="isDark"
      >
        <Icon :name="isDark ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'" class="text-[20px]" aria-hidden="true" />
      </button>

      <button
        @click="requestNotificationPermission"
        aria-label="Enable push notifications"
        class="p-2 min-h-11 min-w-11 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors duration-200 flex items-center justify-center"
      >
        <Icon name="material-symbols:notifications" class="text-[20px]" aria-hidden="true" />
      </button>

      <!-- User Profile Avatar & Badge / Name Dropdown Trigger -->
      <div ref="profileMenuRef" class="relative">
        <button
          @click.stop="toggleProfileMenu"
          class="flex items-center gap-1.5 p-1 min-h-11 rounded-full hover:bg-surface-container-low transition-all border border-transparent hover:border-surface-variant"
          :class="{ 'bg-surface-container-low border-surface-variant': isProfileMenuOpen }"
          title="Profile Menu"
          :aria-expanded="isProfileMenuOpen"
        >
          <UserAvatar :src="authStore.user?.avatarUrl" :name="authStore.user?.name" size="sm" />
          <span v-if="authStore.user?.isGuest" class="hidden lg:inline-block text-[11px] px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full font-semibold uppercase tracking-wider">
            GUEST
          </span>
          <span v-else-if="authStore.user?.name" class="hidden sm:inline-block text-sm font-semibold text-on-surface max-w-[140px] truncate">
            {{ authStore.user.name }}
          </span>
          <Icon name="material-symbols:keyboard-arrow-down" class="text-[18px] text-on-surface-variant transition-transform duration-200" :class="{ 'rotate-180': isProfileMenuOpen }" />
        </button>

        <!-- Backdrop overlay for mobile screen click-outside -->
        <div
          v-if="isProfileMenuOpen"
          @click="closeProfileMenu"
          class="fixed inset-0 z-40 md:hidden bg-black/10 backdrop-blur-[1px]"
        />

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
            class="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-surface-bright/95 backdrop-blur-xl rounded-2xl border border-surface-variant shadow-2xl z-50 p-4 overflow-hidden"
          >
            <!-- User Info Header -->
            <div class="flex items-center gap-3 pb-3 border-b border-surface-variant">
              <UserAvatar :src="authStore.user?.avatarUrl" :name="authStore.user?.name" size="lg" />
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

            <!-- Cloud Storage Status Info -->
            <div class="my-2 p-2.5 rounded-xl bg-surface-container-low/70 border border-surface-variant flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <Icon name="material-symbols:cloud-done" class="text-[18px]" :class="isRedisConnected ? 'text-emerald-500' : 'text-amber-500'" />
                <span class="font-medium text-on-surface">Upstash Storage</span>
              </div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold" :class="isRedisConnected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'">
                {{ isRedisConnected ? 'Connected' : 'Offline' }}
              </span>
            </div>

            <!-- Menu Options -->
            <div class="pt-1 space-y-1">
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

    <!-- Mobile Navigation Drawer -->
    <MobileDrawerMenu
      :is-open="isMobileDrawerOpen"
      @close="isMobileDrawerOpen = false"
    />
  </header>
</template>


