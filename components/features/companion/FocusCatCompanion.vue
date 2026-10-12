<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useCatCompanion } from '~/composables/useCatCompanion'
import FocusCatSvg from './FocusCatSvg.vue'
import type { CatTheme } from '~/types/companion'

const {
  settings,
  mood,
  isTyping,
  isHeld,
  isWalking,
  walkingDirection,
  speechMessage,
  hearts,
  petCat,
  toggleSound,
  toggleCompanion,
  toggleRoaming,
  setPosition,
  setTheme,
  updateSpeechMessage,
  playMeowSound
} = useCatCompanion()

const companionRef = ref<HTMLElement | null>(null)
const isHovered = ref<boolean>(false)
const showSpeechBubble = ref<boolean>(false)
const showPaletteMenu = ref<boolean>(false)
let speechBubbleTimer: ReturnType<typeof setTimeout> | null = null

// Position coordinates in pixels (pure transparent pet)
const posX = ref<number>(60)
const posY = ref<number>(typeof window !== 'undefined' ? window.innerHeight - 140 : 450)
const isMounted = ref<boolean>(false)

// Dragging state
const isDragging = ref<boolean>(false)
const dragStartMouse = { x: 0, y: 0 }
const dragStartPos = { x: 0, y: 0 }
let hasMoved = false

// Roaming walk interval & speed
let roamInterval: ReturnType<typeof setInterval> | null = null
let walkTimeout: ReturnType<typeof setTimeout> | null = null

const themes: Array<{ id: CatTheme; label: string; color: string }> = [
  { id: 'orange', label: 'Orange Tabby', color: '#FFAD60' },
  { id: 'white', label: 'Snow Cloud', color: '#FFFFFF' },
  { id: 'calico', label: 'Tricolor Calico', color: '#F2CC8F' },
  { id: 'black', label: 'Midnight Void', color: '#262933' }
]

function displaySpeechBubble(durationMs = 3800) {
  showSpeechBubble.value = true
  if (speechBubbleTimer) clearTimeout(speechBubbleTimer)
  speechBubbleTimer = setTimeout(() => {
    showSpeechBubble.value = false
  }, durationMs)
}

// Initialize position to bottom shelf
function initPosition() {
  if (typeof window === 'undefined') return
  const petWidth = 140
  const petHeight = 120

  if (settings.value.position && typeof settings.value.position.x === 'number') {
    posX.value = Math.max(10, Math.min(window.innerWidth - petWidth - 10, settings.value.position.x))
    posY.value = Math.max(10, Math.min(window.innerHeight - petHeight - 10, settings.value.position.y))
  } else {
    // Default: sit at bottom right or left on floor
    posX.value = 60
    posY.value = Math.max(20, window.innerHeight - 130)
  }
}

function resetPosition() {
  if (typeof window === 'undefined') return
  posX.value = 60
  posY.value = Math.max(20, window.innerHeight - 130)
  setPosition({ x: posX.value, y: posY.value })
  displaySpeechBubble()
}

// ================= DRAG AND DROP HANDLERS =================
function onPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement
  if (target.closest('button')) return

  isDragging.value = true
  hasMoved = false
  dragStartMouse.x = e.clientX
  dragStartMouse.y = e.clientY
  dragStartPos.x = posX.value
  dragStartPos.y = posY.value

  // Pause walking while dragging
  isWalking.value = false

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const deltaX = e.clientX - dragStartMouse.x
  const deltaY = e.clientY - dragStartMouse.y

  if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
    hasMoved = true
    isHeld.value = true
    showSpeechBubble.value = true
  }

  const petWidth = 140
  const petHeight = 120
  const maxX = Math.max(10, window.innerWidth - petWidth - 10)
  const maxY = Math.max(10, window.innerHeight - petHeight - 10)

  posX.value = Math.max(10, Math.min(maxX, dragStartPos.x + deltaX))
  posY.value = Math.max(10, Math.min(maxY, dragStartPos.y + deltaY))
}

function onPointerUp(e: PointerEvent) {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)

  isDragging.value = false
  isHeld.value = false

  if (hasMoved) {
    setPosition({ x: posX.value, y: posY.value })
    playMeowSound()
    displaySpeechBubble(3000)
  } else {
    // It was a click on the pet -> Pet interaction!
    const target = e.target as HTMLElement
    if (!target.closest('button')) {
      petCat()
      displaySpeechBubble(3500)
    }
  }
}

// ================= ROAMING / WALKING LOGIC =================
function triggerWalk() {
  if (
    !settings.value.enabled ||
    isDragging.value ||
    isTyping.value ||
    mood.value === 'focus' ||
    mood.value === 'break'
  ) {
    return
  }

  if (typeof window === 'undefined') return
  const petWidth = 140
  const maxX = Math.max(20, window.innerWidth - petWidth - 20)

  // Choose next target location along current shelf
  const currentX = posX.value
  let targetX = Math.floor(Math.random() * maxX)

  if (Math.abs(targetX - currentX) < 100) {
    targetX = targetX > currentX ? Math.min(maxX, currentX + 180) : Math.max(20, currentX - 180)
  }

  walkingDirection.value = targetX > currentX ? 'right' : 'left'
  isWalking.value = true

  // Distance determines duration for natural walking speed (~70px per second)
  const distance = Math.abs(targetX - currentX)
  const durationMs = Math.max(2000, Math.min(6000, (distance / 65) * 1000))

  posX.value = targetX
  setPosition({ x: posX.value, y: posY.value })

  if (walkTimeout) clearTimeout(walkTimeout)
  walkTimeout = setTimeout(() => {
    isWalking.value = false
    updateSpeechMessage()
  }, durationMs)
}

function toggleWalkOrSit() {
  if (isWalking.value) {
    isWalking.value = false
    if (walkTimeout) clearTimeout(walkTimeout)
    updateSpeechMessage('Sitting down for a rest! 🐾')
    displaySpeechBubble(3000)
  } else {
    triggerWalk()
  }
}

function startRoamingSchedule() {
  if (roamInterval) clearInterval(roamInterval)
  roamInterval = setInterval(() => {
    if (settings.value.isRoaming && !isWalking.value && !isTyping.value && mood.value === 'idle') {
      triggerWalk()
    }
  }, 14000) // Natural roam every ~14s when idle
}

// If user types or deep work starts, cat stops walking immediately & sits down with laptop
watch(isTyping, (typing) => {
  if (typing) {
    if (isWalking.value) {
      isWalking.value = false
      if (walkTimeout) clearTimeout(walkTimeout)
    }
    displaySpeechBubble(2500)
  }
})

watch(mood, (newMood, oldMood) => {
  if (newMood !== oldMood) {
    if (newMood === 'focus' || newMood === 'break') {
      if (isWalking.value) {
        isWalking.value = false
        if (walkTimeout) clearTimeout(walkTimeout)
      }
    }
    displaySpeechBubble(3500)
  }
})

function handleResize() {
  initPosition()
}

onMounted(() => {
  isMounted.value = true
  initPosition()
  startRoamingSchedule()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (roamInterval) clearInterval(roamInterval)
  if (walkTimeout) clearTimeout(walkTimeout)
  if (speechBubbleTimer) clearTimeout(speechBubbleTimer)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <!-- Completely Transparent Desktop Pet Container (VS Code Pets Style) -->
      <div
        v-if="settings.enabled && isMounted"
        ref="companionRef"
        class="fixed z-[9999] select-none touch-none pointer-events-auto cursor-grab active:cursor-grabbing flex flex-col items-center"
        :style="{
          left: `${posX}px`,
          top: `${posY}px`,
          transition: isWalking && !isDragging ? 'left 3.5s cubic-bezier(0.25, 1, 0.5, 1)' : (isDragging ? 'none' : 'transform 0.15s ease-out')
        }"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false; showPaletteMenu = false"
        @pointerdown="onPointerDown"
      >
        <!-- ================= FLOATING SPEECH BUBBLE ================= -->
        <Transition name="bubble">
          <div
            v-if="showSpeechBubble || isHovered"
            class="absolute -top-11 z-30 pointer-events-auto cursor-pointer max-w-[240px] px-3 py-1.5 bg-surface-bright/95 backdrop-blur-xl border border-surface-variant/90 rounded-2xl shadow-xl text-on-surface text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
            @click.stop="updateSpeechMessage(); displaySpeechBubble(3500)"
            title="Click for a new thought!"
          >
            <span class="text-xs select-none">💬</span>
            <span class="truncate max-w-[190px]">{{ speechMessage }}</span>
            <!-- Bubble Triangle -->
            <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-surface-bright border-b border-r border-surface-variant/90 transform rotate-45 pointer-events-none" />
          </div>
        </Transition>

        <!-- ================= MINIMALIST HOVER HUD (VS Code Pets style) ================= -->
        <Transition name="fade">
          <div
            v-if="isHovered"
            class="absolute -top-20 z-40 flex items-center gap-1 px-2 py-1 bg-surface-bright/95 backdrop-blur-xl border border-surface-variant/90 rounded-full shadow-2xl text-on-surface text-xs pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-150"
            @pointerdown.stop
          >
            <!-- Pet Button -->
            <button
              @click.stop="petCat(); displaySpeechBubble(3500)"
              class="w-6 h-6 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Pet Cat (Headpat)"
            >
              <Icon name="material-symbols:favorite" class="text-[14px]" />
            </button>

            <!-- Walk / Sit Toggle -->
            <button
              @click.stop="toggleWalkOrSit"
              class="w-6 h-6 rounded-full flex items-center justify-center text-secondary hover:bg-secondary/10 transition-colors"
              :title="isWalking ? 'Make Cat Sit Down' : 'Make Cat Walk Around'"
            >
              <Icon :name="isWalking ? 'material-symbols:chair' : 'material-symbols:directions-walk'" class="text-[15px]" />
            </button>

            <!-- Auto Roam Toggle -->
            <button
              @click.stop="toggleRoaming"
              class="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              :class="{ 'text-emerald-600': settings.isRoaming }"
              :title="settings.isRoaming ? 'Auto Roaming: ON' : 'Auto Roaming: OFF'"
            >
              <Icon :name="settings.isRoaming ? 'material-symbols:autorenew' : 'material-symbols:pause-circle-outline'" class="text-[15px]" />
            </button>

            <!-- Sound Toggle -->
            <button
              @click.stop="toggleSound"
              class="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              :title="settings.soundEnabled ? 'Mute Meow & Purr' : 'Unmute Sounds'"
            >
              <Icon :name="settings.soundEnabled ? 'material-symbols:volume-up' : 'material-symbols:volume-off'" class="text-[15px]" />
            </button>

            <!-- Palette Toggle -->
            <button
              @click.stop="showPaletteMenu = !showPaletteMenu"
              class="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              :class="{ 'bg-surface-container text-primary': showPaletteMenu }"
              title="Change Cat Breed / Coat"
            >
              <Icon name="material-symbols:palette" class="text-[14px]" />
            </button>

            <!-- Reset Pos -->
            <button
              @click.stop="resetPosition"
              class="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              title="Reset Position to Bottom"
            >
              <Icon name="material-symbols:home-pin" class="text-[14px]" />
            </button>

            <!-- Close / Hide -->
            <button
              @click.stop="toggleCompanion"
              class="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
              title="Hide Pet"
            >
              <Icon name="material-symbols:close" class="text-[14px]" />
            </button>
          </div>
        </Transition>

        <!-- Coat Palette Popup -->
        <Transition name="fade">
          <div
            v-if="showPaletteMenu && isHovered"
            class="absolute -top-28 z-50 flex items-center gap-1.5 p-1.5 bg-surface-bright/95 backdrop-blur-xl border border-surface-variant/90 rounded-2xl shadow-2xl pointer-events-auto"
            @pointerdown.stop
          >
            <button
              v-for="t in themes"
              :key="t.id"
              @click.stop="setTheme(t.id)"
              class="w-6 h-6 rounded-full border border-black/10 shadow-2xs flex items-center justify-center transition-transform hover:scale-125"
              :class="{ 'ring-2 ring-primary ring-offset-1': settings.theme === t.id }"
              :style="{ backgroundColor: t.color }"
              :title="t.label"
            />
          </div>
        </Transition>

        <!-- ================= FLOATING HEARTS ON CLICK ================= -->
        <TransitionGroup name="heart">
          <div
            v-for="h in hearts"
            :key="h.id"
            class="absolute pointer-events-none z-30 text-rose-500 font-bold flex items-center gap-0.5 text-base floating-heart"
            :style="{ transform: `translate(${h.x}px, ${h.y}px)` }"
          >
            <span>💖</span>
            <span class="text-[10px] text-rose-600 font-extrabold">+1 love</span>
          </div>
        </TransitionGroup>

        <!-- ================= PURE VECTOR CAT SPRITE ================= -->
        <div class="relative flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
          <FocusCatSvg
            :mood="mood"
            :theme="settings.theme"
            :width="135"
            :height="112"
            class="filter drop-shadow-md transition-all duration-300"
            :style="{
              transform: walkingDirection === 'left' && mood === 'walking' ? 'scaleX(-1)' : 'scaleX(1)'
            }"
          />
        </div>

        <!-- Subtle Under-Cat Shadow on Floor -->
        <div
          class="w-20 h-2.5 rounded-full bg-black/10 blur-[3px] pointer-events-none -mt-1 transition-all"
          :class="{ 'scale-75 opacity-30': isHeld, 'scale-110 opacity-60': isWalking }"
        />
      </div>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
/* Floating Heart Animation */
.floating-heart {
  animation: floatHeart 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes floatHeart {
  0% {
    opacity: 1;
    transform: translateY(0) scale(0.6);
  }
  50% {
    opacity: 1;
    transform: translateY(-26px) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
}

.bubble-enter-active,
.bubble-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.92);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
