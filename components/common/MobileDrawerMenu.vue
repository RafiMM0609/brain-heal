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

/**
 * Swipe-to-close.
 *
 * Spatial consistency: the drawer enters from the left edge, so it must leave
 * the same way. This reverses the entrance rather than inventing a new axis,
 * which is what makes the gesture discoverable without an instruction.
 *
 * Track phase is 1:1 on the element's own transform; release is decided by
 * distance OR velocity, and an un-dismissed drag snaps back fast.
 */
const drawerRef = ref<HTMLElement | null>(null)

const DISTANCE_RATIO = 0.4
const VELOCITY_THRESHOLD = 0.5
const SNAP_MS = 180
const EXIT_MS = 200
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'

let exitTimer: ReturnType<typeof setTimeout> | null = null

const swipe = {
  active: false,
  pointerId: null as number | null,
  startX: 0,
  x: 0,
  lastX: 0,
  lastT: 0,
  velocity: 0
}

let drawerWidth = 320

function paintDrawer(x: number, transition: string) {
  const el = drawerRef.value
  if (!el) return
  el.style.transition = transition
  el.style.transform = x === 0 ? '' : `translateX(${x}px)`
}

function onDrawerPointerDown(e: PointerEvent) {
  const el = drawerRef.value
  if (!el) return

  // A press on a link or button is a tap; only start a drag from dead space.
  const target = e.target as HTMLElement | null
  if (target?.closest('button, a, input, textarea, select, [role="button"]')) return

  drawerWidth = el.offsetWidth || 320

  swipe.active = true
  swipe.pointerId = e.pointerId
  swipe.startX = e.clientX
  swipe.x = 0
  swipe.lastX = e.clientX
  swipe.lastT = e.timeStamp
  swipe.velocity = 0

  el.classList.add('gesture-tracking')
}

function onDrawerPointerMove(e: PointerEvent) {
  if (!swipe.active || e.pointerId !== swipe.pointerId) return

  const dt = e.timeStamp - swipe.lastT
  if (dt > 0) swipe.velocity = (e.clientX - swipe.lastX) / dt
  swipe.lastX = e.clientX
  swipe.lastT = e.timeStamp

  // Leftward closes; rightward rubber-bands at a fraction of the distance so
  // the edge reads as a wall rather than a hard stop.
  const dx = e.clientX - swipe.startX
  swipe.x = dx < 0 ? dx : dx * 0.2

  paintDrawer(swipe.x, 'none')
}

function onDrawerPointerUp(e: PointerEvent) {
  if (!swipe.active || e.pointerId !== swipe.pointerId) return

  swipe.active = false
  swipe.pointerId = null

  const el = drawerRef.value
  el?.classList.remove('gesture-tracking')

  const passedDistance = swipe.x < -drawerWidth * DISTANCE_RATIO
  const flung = swipe.velocity < -VELOCITY_THRESHOLD && swipe.x < -24

  if (passedDistance || flung) {
    /*
     * Finish the slide-out inline, then close. The drawer still carries an
     * inline `transition` from the track phase, which outranks the
     * `.drawer-leave-*` class, so closing immediately would make it vanish
     * instead of sliding.
     */
    paintDrawer(-(drawerWidth || 320), `transform ${EXIT_MS}ms ${EASE_OUT}`)
    if (exitTimer !== null) clearTimeout(exitTimer)
    exitTimer = setTimeout(() => {
      exitTimer = null
      handleClose()
    }, EXIT_MS)
    swipe.x = 0
  } else {
    paintDrawer(0, `transform ${SNAP_MS}ms ${EASE_OUT}`)
    swipe.x = 0
  }
}

onUnmounted(() => {
  if (exitTimer !== null) {
    clearTimeout(exitTimer)
    exitTimer = null
  }
})

function resetDrawerTransform() {
  const el = drawerRef.value
  if (!el) return
  el.classList.remove('gesture-tracking')
  el.style.transition = ''
  el.style.transform = ''
  swipe.active = false
  swipe.pointerId = null
  swipe.x = 0
}

watch(() => props.isOpen, (open) => {
  if (!open) nextTick(resetDrawerTransform)
})
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
      name="drawer"
    >
      <div
        v-if="isOpen"
        class="fixed inset-y-0 left-0 z-[101] w-[85vw] max-w-sm bg-surface-bright/95 backdrop-blur-2xl border-r border-surface-variant/80 shadow-2xl flex flex-col pt-safe pb-safe md:hidden select-none overflow-hidden touch-pan-y"
        ref="drawerRef"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
        data-drawer-drag-handle
        @pointerdown="onDrawerPointerDown"
        @pointermove="onDrawerPointerMove"
        @pointerup="onDrawerPointerUp"
        @pointercancel="onDrawerPointerUp"
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

<style scoped>
/**
 * The drawer's transition previously pointed at two classes Tailwind can never
 * generate — `duration-250` (not a step in the scale) and a bare
 * `cubic-bezier(...)` as a class name — so the enter animation silently fell
 * back to `transition-transform` at its default timing. Declaring the motion
 * here is both correct and predictable.
 *
 * It is a transition, not a keyframe: the drawer can be grabbed mid-flight and
 * dragged back, and only a transition survives that interruption.
 */
.drawer-enter-active {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.drawer-leave-active {
  transition: transform 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}

.drawer-enter-to,
.drawer-leave-from {
  transform: translateX(0);
}
</style>