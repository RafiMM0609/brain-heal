import { ref, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useFocusStore } from '~/stores/useFocusStore'
import type { CompanionMood, CatTheme, CompanionSettings, CompanionStats } from '~/types/companion'

const DEFAULT_SETTINGS: CompanionSettings = {
  enabled: true,
  soundEnabled: true,
  name: 'Mochi',
  isMinimized: false,
  isRoaming: true,
  theme: 'orange',
  position: null
}

const DEFAULT_STATS: CompanionStats = {
  pets: 0,
  keystrokes: 0
}

// Global shared state across components
const settings = ref<CompanionSettings>({ ...DEFAULT_SETTINGS })
const stats = ref<CompanionStats>({ ...DEFAULT_STATS })
const isPetted = ref<boolean>(false)
const isTyping = ref<boolean>(false)
const isHeld = ref<boolean>(false)
const isWalking = ref<boolean>(false)
const walkingDirection = ref<'left' | 'right'>('right')
const lastKeyTimestamp = ref<number>(0)
const speechMessage = ref<string>('Meow! Ready to focus together? 🐾')
const hearts = ref<Array<{ id: number; x: number; y: number }>>([])

let heartIdCounter = 0
let audioCtx: AudioContext | null = null
let typingTimeout: ReturnType<typeof setTimeout> | null = null
let pettedTimeout: ReturnType<typeof setTimeout> | null = null
let messageCycleTimeout: ReturnType<typeof setTimeout> | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) {
      audioCtx = new AudioCtx()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

// Synthesizes a soft, endearing cat meow via Web Audio API
function playMeowSound() {
  if (!settings.value.soundEnabled) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Characteristic cat mew pitch contour (slight rise then gentle drop)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(460, now)
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.12)
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.35)

    // Gentle volume envelope
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.42)
  } catch (err) {
    console.debug('[CatCompanion] Audio meow failed:', err)
  }
}

// Synthesizes a gentle purr vibration
function playPurrSound() {
  if (!settings.value.soundEnabled) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    const mainGain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(75, now)

    // LFO for rhythmic rumble
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(24, now) // ~24 purr rumbles per second

    lfoGain.gain.setValueAtTime(0.04, now)
    mainGain.gain.setValueAtTime(0.05, now)
    mainGain.gain.linearRampToValueAtTime(0.001, now + 0.8)

    lfo.connect(lfoGain.gain)
    osc.connect(mainGain)
    mainGain.connect(ctx.destination)

    osc.start(now)
    lfo.start(now)
    osc.stop(now + 0.8)
    lfo.stop(now + 0.8)
  } catch (err) {
    console.debug('[CatCompanion] Audio purr failed:', err)
  }
}

// Synthesizes a tiny soft paw tap
function playPawTapSound() {
  if (!settings.value.soundEnabled) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    const randomFreq = 320 + Math.random() * 80
    osc.frequency.setValueAtTime(randomFreq, now)
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.04)

    gain.gain.setValueAtTime(0.02, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.05)
  } catch (err) {
    console.debug('[CatCompanion] Audio tap failed:', err)
  }
}

export function useCatCompanion() {
  const focusStore = useFocusStore()

  // Load persisted settings on client
  if (import.meta.client) {
    try {
      const savedSettings = localStorage.getItem('neuralflow_cat_companion_settings')
      if (savedSettings) {
        settings.value = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }
      }
      const savedStats = localStorage.getItem('neuralflow_cat_companion_stats')
      if (savedStats) {
        stats.value = { ...DEFAULT_STATS, ...JSON.parse(savedStats) }
      }
    } catch (e) {
      console.warn('Failed to parse cat companion storage:', e)
    }
  }

  function saveSettings() {
    if (import.meta.client) {
      localStorage.setItem('neuralflow_cat_companion_settings', JSON.stringify(settings.value))
    }
  }

  function saveStats() {
    if (import.meta.client) {
      localStorage.setItem('neuralflow_cat_companion_stats', JSON.stringify(stats.value))
    }
  }

  // Reactive Mood determination
  const mood = computed<CompanionMood>(() => {
    if (isHeld.value) return 'held'
    if (isPetted.value) return 'petted'

    // If timer is on break
    if (focusStore.isRunning && (focusStore.mode === 'shortBreak' || focusStore.mode === 'longBreak')) {
      return 'break'
    }

    // If user is actively typing right now
    if (isTyping.value) {
      return 'typing'
    }

    // If timer is running deep work
    if (focusStore.isRunning && (focusStore.mode === 'work' || focusStore.mode === 'quickWork')) {
      return 'focus'
    }

    // If walking around
    if (isWalking.value) {
      return 'walking'
    }

    return 'idle'
  })

  // Dialogue lines per mood
  const moodMessages: Record<CompanionMood, string[]> = {
    idle: [
      'Ready when you are! Click me for pets 🐾',
      'Hydrate and relax your shoulders! 💧',
      'Small steps every day lead to big results ✨',
      'Watching over your brain healing process 🌸'
    ],
    typing: [
      'Bongo paws engaged! Tap tap tap! ⌨️',
      'Look at that writing speed! Amazing! 🚀',
      'Capture all those thoughts into reality 📝',
      'Fast typing detected! Keep that rhythm! 🔥'
    ],
    focus: [
      'Deep work mode! Locked in together! 🎯',
      'Study glasses on. No distractions allowed 👓',
      'Flow state achieved... Keep going strong! ⚡',
      'Healing our focus one minute at a time 🌿'
    ],
    break: [
      'Rest time! Time for a warm beverage ☕',
      'Zzz... Dopamine receptors recharging 💤',
      'Stretch those paws and take a deep breath 🧘',
      'Good work on that session! Rest well 🌸'
    ],
    celebrate: [
      'Paws in the air! You did it! 🎉',
      'Session completed! High five! 🐾',
      'Look at that focus achievement! So proud! 🌟'
    ],
    petted: [
      'Purrrrrr... thank you for the love! 💖',
      'Nyaa~ Dopamine boost unlocked! ✨',
      'Meow! You are doing your best, keep it up! 🌸',
      '*Happy purrs and soft ear twitches* 🐾'
    ],
    walking: [
      'Strolling around to stretch my tiny paws! 🐾',
      'Sniffing out some good productivity vibes... 🌸',
      'Just taking a quick lap! Tell me when we focus! 🏃‍♂️',
      'Exploring your screen! Looking nice today ✨'
    ],
    held: [
      'Wheee! Flying cat! Where are we going? 🚀',
      'Picked up by the scruff! Mew! 😻',
      'Hold on tight! Air travel mode activated! ✈️',
      'Putting me in a better spot? Thank you! 🐾'
    ]
  }

  function updateSpeechMessage(custom?: string) {
    if (custom) {
      speechMessage.value = custom
      return
    }
    const pool = moodMessages[mood.value] || moodMessages.idle
    const random = pool[Math.floor(Math.random() * pool.length)]
    speechMessage.value = random
  }

  // Pet action
  function petCat() {
    isPetted.value = true
    stats.value.pets += 1
    saveStats()

    // Trigger audio
    if (Math.random() > 0.4) {
      playPurrSound()
    } else {
      playMeowSound()
    }

    // Spawn heart particle
    const heart = {
      id: ++heartIdCounter,
      x: Math.floor(Math.random() * 40) - 20,
      y: -10
    }
    hearts.value.push(heart)
    setTimeout(() => {
      hearts.value = hearts.value.filter(h => h.id !== heart.id)
    }, 1500)

    updateSpeechMessage()

    if (pettedTimeout) clearTimeout(pettedTimeout)
    pettedTimeout = setTimeout(() => {
      isPetted.value = false
      updateSpeechMessage()
    }, 2400)
  }

  // Keyboard handler for reactive Bongo Typing
  function handleKeyDown(e: KeyboardEvent) {
    // Ignore stand-alone modifier keys
    if (['Control', 'Shift', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return

    stats.value.keystrokes += 1
    if (stats.value.keystrokes % 25 === 0) {
      saveStats()
    }

    lastKeyTimestamp.value = Date.now()

    if (!isTyping.value) {
      isTyping.value = true
      // Only play paw tap if enabled and not flooded
      if (Math.random() < 0.35) {
        playPawTapSound()
      }
      if (!isPetted.value) {
        updateSpeechMessage()
      }
    } else if (Math.random() < 0.2) {
      playPawTapSound()
    }

    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      isTyping.value = false
      if (!isPetted.value) {
        updateSpeechMessage()
      }
    }, 650)
  }

  // Watch mood transitions
  watch(mood, (newMood, oldMood) => {
    if (newMood !== oldMood) {
      updateSpeechMessage()
    }
  })

  // Watch focus completion
  watch(() => focusStore.remainingSeconds, (rem) => {
    if (rem === 0 && focusStore.elapsedSeconds > 0) {
      updateSpeechMessage('Session finished! You did fantastic! 🎉')
      playMeowSound()
    }
  })

  function toggleCompanion() {
    settings.value.enabled = !settings.value.enabled
    saveSettings()
  }

  function toggleSound() {
    settings.value.soundEnabled = !settings.value.soundEnabled
    saveSettings()
    if (settings.value.soundEnabled) {
      playMeowSound()
    }
  }

  function toggleMinimize() {
    settings.value.isMinimized = !settings.value.isMinimized
    saveSettings()
  }

  function setTheme(t: CatTheme) {
    settings.value.theme = t
    saveSettings()
  }

  function setName(n: string) {
    settings.value.name = n.trim() || 'Mochi'
    saveSettings()
  }

  function toggleRoaming() {
    settings.value.isRoaming = !settings.value.isRoaming
    saveSettings()
    if (!settings.value.isRoaming) {
      isWalking.value = false
    }
  }

  function setPosition(pos: { x: number; y: number } | null) {
    settings.value.position = pos
    saveSettings()
  }

  if (getCurrentInstance()) {
    let isMounted = false
    onMounted(() => {
      if (isMounted) return
      isMounted = true
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeyDown, { passive: true })
      }
      // Periodic random wholesome thought every 45s
      messageCycleTimeout = setInterval(() => {
        if (!isTyping.value && !isPetted.value) {
          updateSpeechMessage()
        }
      }, 45000)
    })

    onUnmounted(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown)
      }
      if (typingTimeout) clearTimeout(typingTimeout)
      if (pettedTimeout) clearTimeout(pettedTimeout)
      if (messageCycleTimeout) clearInterval(messageCycleTimeout)
    })
  } else if (typeof window !== 'undefined') {
    // If called outside setup (e.g. testing), register listener directly
    window.addEventListener('keydown', handleKeyDown, { passive: true })
  }

  return {
    settings,
    stats,
    mood,
    isPetted,
    isTyping,
    isHeld,
    isWalking,
    walkingDirection,
    speechMessage,
    hearts,
    petCat,
    toggleCompanion,
    toggleSound,
    toggleMinimize,
    toggleRoaming,
    setPosition,
    setTheme,
    setName,
    playMeowSound,
    updateSpeechMessage
  }
}
