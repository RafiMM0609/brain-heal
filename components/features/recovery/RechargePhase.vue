<script setup lang="ts">
import AppModal from '~/components/ui/AppModal.vue'
import { useFocusStore } from '~/stores/useFocusStore'

const focusStore = useFocusStore()
const secondsRemaining = ref(5 * 60) // 5 minutes default
const isTimerRunning = ref(true)
let timer: any = null

const activeModal = ref<'breathing' | 'hydrate' | 'stretch' | null>(null)
const hydrationGlasses = ref(0)
const breathingPhase = ref<'Inhale' | 'Hold' | 'Exhale' | 'Hold (Out)'>('Inhale')
const breathingSeconds = ref(4)
let breathingInterval: any = null

const formattedTime = computed(() => {
  const m = Math.floor(secondsRemaining.value / 60)
  const s = secondsRemaining.value % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

onMounted(() => {
  focusStore.resetEnergyPoints()
  startRecoveryTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (breathingInterval) clearInterval(breathingInterval)
})

function startRecoveryTimer() {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (secondsRemaining.value > 0) {
      secondsRemaining.value--
    } else {
      clearInterval(timer)
      isTimerRunning.value = false
    }
  }, 1000)
}

function openBreathingGuide() {
  activeModal.value = 'breathing'
  breathingPhase.value = 'Inhale'
  breathingSeconds.value = 4
  
  if (breathingInterval) clearInterval(breathingInterval)
  breathingInterval = setInterval(() => {
    if (breathingSeconds.value > 1) {
      breathingSeconds.value--
    } else {
      breathingSeconds.value = 4
      if (breathingPhase.value === 'Inhale') breathingPhase.value = 'Hold'
      else if (breathingPhase.value === 'Hold') breathingPhase.value = 'Exhale'
      else if (breathingPhase.value === 'Exhale') breathingPhase.value = 'Hold (Out)'
      else breathingPhase.value = 'Inhale'
    }
  }, 1000)
}

function endBreakEarly() {
  focusStore.resetEnergyPoints()
  const router = useRouter()
  router.push('/')
}

</script>

<template>
  <div class="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center text-center p-4 overflow-hidden">
    <!-- Ambient Breathing Radial Background -->
    <div class="absolute inset-0 soft-gradient opacity-30 z-0 pointer-events-none" />
    <div class="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
      <div class="w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-secondary-fixed opacity-20 blur-3xl breathe-animation" />
    </div>

    <div class="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
      <!-- Header -->
      <header class="mb-8">
        <Icon name="material-symbols:self-improvement" class="text-[48px] text-secondary mb-2" />
        <h1 class="text-headline-lg md:text-display-lg font-bold text-primary mb-2">Recharge Phase</h1>
        <p class="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          Allow your neural pathways to reset and restore glucose levels. Engage in one of the guided recovery activities below.
        </p>
      </header>

      <!-- Timer Section -->
      <section class="mb-10 relative">
        <div class="w-64 h-64 md:w-72 md:h-72 rounded-full border-4 border-surface-container-highest flex flex-col items-center justify-center relative bg-surface shadow-md">
          <div class="font-mono text-display-lg font-bold text-primary z-10 text-5xl">
            {{ formattedTime }}
          </div>
          <div class="text-label-md text-on-surface-variant uppercase tracking-widest mt-2 z-10 font-semibold">
            {{ isTimerRunning ? 'Recovery Remaining' : 'Recharge Complete' }}
          </div>
        </div>
      </section>

      <!-- Guided Activity Cards (3 Bento Items) -->
      <section class="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Card 1: Box Breathing -->
        <div class="bg-surface rounded-xl p-6 shadow-sm border border-outline-variant hover:border-primary/30 transition-all text-left flex flex-col h-full">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
              <Icon name="material-symbols:air" class="text-[20px]" />
            </div>
            <h3 class="text-headline-md font-bold text-primary">Box Breathing</h3>
          </div>
          <p class="text-body-md text-on-surface-variant mb-6 flex-grow">
            Inhale 4s, hold 4s, exhale 4s, hold 4s. Proven method to immediately lower cortisol and reset the vagus nerve.
          </p>
          <button
            @click="openBreathingGuide"
            class="w-full py-3 rounded-lg border border-outline text-primary font-semibold hover:bg-surface-container-low transition-colors"
          >
            Start Guide
          </button>
        </div>

        <!-- Card 2: Hydrate -->
        <div class="bg-surface rounded-xl p-6 shadow-sm border border-outline-variant hover:border-primary/30 transition-all text-left flex flex-col h-full">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
              <Icon name="material-symbols:water-drop" class="text-[20px]" />
            </div>
            <h3 class="text-headline-md font-bold text-primary">Hydration</h3>
          </div>
          <p class="text-body-md text-on-surface-variant mb-6 flex-grow">
            Drink 8oz of fresh water. Brain tissue is 73% water; mild dehydration causes measurable cognitive slowing.
          </p>
          <button
            @click="activeModal = 'hydrate'"
            class="w-full py-3 rounded-lg border border-outline text-primary font-semibold hover:bg-surface-container-low transition-colors"
          >
            Log Intake ({{ hydrationGlasses }} glasses)
          </button>
        </div>

        <!-- Card 3: Stretch -->
        <div class="bg-surface rounded-xl p-6 shadow-sm border border-outline-variant hover:border-primary/30 transition-all text-left flex flex-col h-full">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0">
              <Icon name="material-symbols:accessibility-new" class="text-[20px]" />
            </div>
            <h3 class="text-headline-md font-bold text-primary">Stretch & Move</h3>
          </div>
          <p class="text-body-md text-on-surface-variant mb-6 flex-grow">
            Stand up and perform light dynamic stretching to restore cerebrovascular blood flow and alleviate neck strain.
          </p>
          <button
            @click="activeModal = 'stretch'"
            class="w-full py-3 rounded-lg border border-outline text-primary font-semibold hover:bg-surface-container-low transition-colors"
          >
            View Routine
          </button>
        </div>
      </section>

      <!-- Action Button -->
      <div class="flex justify-center w-full">
        <button
          @click="endBreakEarly"
          class="px-8 py-3.5 rounded-full border border-outline text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-semibold transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    </div>

    <!-- Modals for Guided Activities -->
    <!-- Box Breathing Modal -->
    <AppModal :isOpen="activeModal === 'breathing'" title="Guided Box Breathing" @close="activeModal = null">
      <div class="flex flex-col items-center justify-center py-6 text-center">
        <div class="w-36 h-36 rounded-full bg-secondary-container text-on-secondary-container flex flex-col items-center justify-center mb-6 transition-all duration-1000 transform breathe-animation">
          <span class="text-2xl font-bold">{{ breathingPhase }}</span>
          <span class="text-4xl font-mono mt-1 font-bold">{{ breathingSeconds }}s</span>
        </div>
        <p class="text-body-md text-on-surface-variant max-w-sm">
          Focus on your diaphragm. Keep your shoulders relaxed and follow the pacing circle.
        </p>
      </div>
    </AppModal>

    <!-- Hydration Modal -->
    <AppModal :isOpen="activeModal === 'hydrate'" title="Hydration Tracker" @close="activeModal = null">
      <div class="text-center py-4 space-y-4">
        <Icon name="material-symbols:local-drink" class="text-6xl text-primary-container" />
        <h3 class="text-xl font-bold text-primary">Logged Today: {{ hydrationGlasses }} Glasses ({{ hydrationGlasses * 250 }} ml)</h3>
        <div class="flex justify-center gap-4">
          <button
            @click="hydrationGlasses++"
            class="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container transition-colors"
          >
            + Add Glass (250ml)
          </button>
        </div>
      </div>
    </AppModal>

    <!-- Stretch Routine Modal -->
    <AppModal :isOpen="activeModal === 'stretch'" title="Post-Focus Stretch Routine" @close="activeModal = null">
      <div class="space-y-4 text-left">
        <div class="p-3 bg-surface-container-low rounded-lg border border-surface-variant">
          <h4 class="font-bold text-primary">1. Neck Roll (30s)</h4>
          <p class="text-sm text-on-surface-variant">Gently roll head clockwise and counterclockwise to release cervical tension.</p>
        </div>
        <div class="p-3 bg-surface-container-low rounded-lg border border-surface-variant">
          <h4 class="font-bold text-primary">2. Shoulder Shrugs & Retraction (30s)</h4>
          <p class="text-sm text-on-surface-variant">Pull shoulders up to ears, then squeeze shoulder blades together behind back.</p>
        </div>
        <div class="p-3 bg-surface-container-low rounded-lg border border-surface-variant">
          <h4 class="font-bold text-primary">3. Standing Torso Twist (30s)</h4>
          <p class="text-sm text-on-surface-variant">Stand upright and twist torso side to side to reactivate spine alignment.</p>
        </div>
      </div>
    </AppModal>
  </div>
</template>
