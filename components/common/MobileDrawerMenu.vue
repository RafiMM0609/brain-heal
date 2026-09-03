<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'
import { useFocusStore } from '~/stores/useFocusStore'
import { useDocumentPiP } from '~/composables/useDocumentPiP'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const focusStore = useFocusStore()
const { isSupported: isPiPSupported, pipWindow, togglePiP } = useDocumentPiP()
const { requestNotificationPermission } = useAudioNotification()

function handleClose() {
  emit('close')
}

function handleNavigation(path: string) {
  emit('close')
  router.push(path)
}

function handleLogout() {
  emit('close')
  authStore.logout()
  router.push('/login')
}

function handleOpenDistractionDump() {
  emit('close')
  focusStore.openDistractionDump()
}

function handleTogglePiP() {
  emit('close')
  togglePiP()
}

function handleNotifications() {
  emit('close')
  requestNotificationPermission()
}

// Close drawer on ESC key
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

watch(() => props.isOpen, (newVal) => {
  if (typeof document !== 'undefined') {
    if (newVal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = ''
  }
})

interface NavItem {
  label: string
  to: string
  icon: string
  description: string
}

const navItems: NavItem[] = [
  { label: 'Prep', to: '/', icon: 'material-symbols:edit-note', description: 'Eisenhower Matrix & Priority Engine' },
  { label: 'Execute', to: '/execute', icon: 'material-symbols:bolt', description: 'Pomodoro Timer & Focus Engine' },
  { label: 'Recovery', to: '/recovery', icon: 'material-symbols:self-improvement', description: 'NSDR & Ambient Breathing' },
  { label: 'Media Share', to: '/share', icon: 'material-symbols:content-paste-go', description: 'Cognitive Clipboard & Links' }
]

function isLinkActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        @click="handleClose"
        class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
        aria-hidden="true"
      />
    </Transition>

    <!-- Mobile Drawer Content -->
    <Transition
      enter-active-class="transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-250 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <div
        v-if="isOpen"
        class="fixed inset-y-0 left-0 z-[101] w-[85vw] max-w-sm bg-surface-bright/95 backdrop-blur-2xl border-r border-surface-variant/80 shadow-2xl flex flex-col pt-safe pb-safe md:hidden select-none overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        <!-- Header & Close Button -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-surface-variant/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 shadow-sm">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAao3QwwHMAM-b6FMmuzfoxU-svHKJMDadY4C5JBpTlJ9IfLBQjbY5aKCGL3JRMTNuDOTsp4S9SOPkTqAJLAU-jirtIlATQcalX2zIu6PRFE5G9Wub6JQDxwoKX-aYxW8JAtUk4hPkBj4J0ISqqxD8srXZjJqONMOJIPF9H1etGLkHY5ZesiCnWHX-6XLXBYgebT36KxSYfqTwButT_k5xPPY3T8Yy-KAtdYQQh2GXmFXADdRONhEKe"
                alt="Cognitive Lab Logo"
                class="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 class="text-headline-md font-bold text-primary leading-tight">Cognitive Lab</h2>
              <p class="text-[11px] text-on-surface-variant font-medium">
                {{ authStore.user?.state || 'Relaxed Alertness' }}
              </p>
            </div>
          </div>

          <button
            @click="handleClose"
            class="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-all active:scale-95"
            aria-label="Close Option Menu"
          >
            <Icon name="material-symbols:close" class="text-[24px]" />
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <!-- User Profile Card -->
          <div class="bg-surface-container-low rounded-2xl p-3.5 border border-surface-variant/70 flex items-center gap-3 shadow-xs">
            <img
              :src="authStore.user?.avatarUrl"
              :alt="authStore.user?.name || 'User Avatar'"
              class="w-12 h-12 rounded-full border-2 border-primary/20 object-cover shrink-0"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <h3 class="text-sm font-bold text-on-surface truncate">
                  {{ authStore.user?.name || 'Guest User' }}
                </h3>
                <span v-if="authStore.user?.isGuest" class="text-[9px] px-1.5 py-0.5 bg-primary-fixed text-on-primary-fixed rounded font-bold uppercase shrink-0">
                  GUEST
                </span>
              </div>
              <p class="text-xs text-on-surface-variant truncate mt-0.5">
                {{ authStore.user?.email || (authStore.user?.isGuest ? 'guest@cognitivelab.local' : 'No email set') }}
              </p>
            </div>
          </div>

          <!-- Quick Action Banner -->
          <button
            @click="handleNavigation('/execute')"
            class="w-full py-3 px-4 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-md hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-between group"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Icon name="material-symbols:bolt" class="text-[20px] text-on-primary" />
              </div>
              <span>Start Deep Work</span>
            </div>
            <Icon name="material-symbols:arrow-forward" class="text-[18px] transition-transform group-hover:translate-x-1" />
          </button>

          <!-- Main Navigation Section -->
          <div>
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-outline px-2 mb-2">Navigation</h4>
            <div class="space-y-1.5">
              <button
                v-for="item in navItems"
                :key="item.to"
                @click="handleNavigation(item.to)"
                class="w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-3.5 transition-all active:scale-[0.98]"
                :class="[
                  isLinkActive(item.to)
                    ? 'bg-primary-fixed/40 text-primary font-bold shadow-xs'
                    : 'text-on-surface hover:bg-surface-container-high'
                ]"
              >
                <div
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform"
                  :class="[
                    isLinkActive(item.to) ? 'bg-primary text-on-primary shadow-xs' : 'bg-surface-container-high text-on-surface-variant'
                  ]"
                >
                  <Icon :name="item.icon" class="text-[20px]" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm leading-snug flex items-center justify-between">
                    <span>{{ item.label }}</span>
                    <span v-if="isLinkActive(item.to)" class="w-2 h-2 rounded-full bg-primary"></span>
                  </div>
                  <div class="text-[11px] text-outline font-normal truncate mt-0.5">
                    {{ item.description }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Application Options & Utilities -->
          <div>
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-outline px-2 mb-2">Options & Utilities</h4>
            <div class="space-y-1.5">
              <button
                @click="handleOpenDistractionDump"
                class="w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-3.5 text-on-surface hover:bg-surface-container-high active:scale-[0.98] transition-all"
              >
                <div class="w-9 h-9 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                  <Icon name="material-symbols:edit-note" class="text-[20px]" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium">Distraction Dump</div>
                  <div class="text-[11px] text-outline truncate">Quick brain dump thoughts & tasks</div>
                </div>
              </button>

              <button
                v-if="isPiPSupported"
                @click="handleTogglePiP"
                class="w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-3.5 text-on-surface hover:bg-surface-container-high active:scale-[0.98] transition-all"
                :class="{ 'bg-secondary/10 text-secondary font-semibold': pipWindow }"
              >
                <div
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  :class="pipWindow ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'"
                >
                  <Icon name="material-symbols:picture-in-picture-alt" class="text-[20px]" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium">Floating Focus Anchor</div>
                  <div class="text-[11px] text-outline truncate">Picture-in-Picture focus window</div>
                </div>
              </button>

              <button
                @click="handleNotifications"
                class="w-full px-3.5 py-2.5 rounded-xl text-left flex items-center gap-3.5 text-on-surface hover:bg-surface-container-high active:scale-[0.98] transition-all"
              >
                <div class="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                  <Icon name="material-symbols:notifications" class="text-[20px]" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium">Enable Notifications</div>
                  <div class="text-[11px] text-outline truncate">Get focus & timer completion alerts</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer / Logout Action -->
        <div class="px-4 py-3 border-t border-surface-variant/60 bg-surface-container-lowest/50">
          <button
            @click="handleLogout"
            class="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-error bg-error-container/30 hover:bg-error-container/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-error/20"
          >
            <Icon name="material-symbols:logout" class="text-[20px]" />
            <span>Logout Account</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
