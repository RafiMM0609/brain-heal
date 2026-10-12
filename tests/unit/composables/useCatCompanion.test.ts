import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCatCompanion } from '~/composables/useCatCompanion'
import { useFocusStore } from '~/stores/useFocusStore'

describe('composables/useCatCompanion', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with default settings and idle mood', () => {
    const { settings, mood, isTyping, isPetted } = useCatCompanion()
    expect(settings.value.enabled).toBe(true)
    expect(settings.value.name).toBe('Mochi')
    expect(isTyping.value).toBe(false)
    expect(isPetted.value).toBe(false)
    expect(mood.value).toBe('idle')
  })

  it('switches to petted mood and increments pet count on petCat()', () => {
    const { mood, stats, petCat, isPetted, hearts } = useCatCompanion()
    const initialPets = stats.value.pets

    petCat()

    expect(stats.value.pets).toBe(initialPets + 1)
    expect(isPetted.value).toBe(true)
    expect(mood.value).toBe('petted')
    expect(hearts.value.length).toBeGreaterThan(0)

    // Advance timer past pet animation
    vi.advanceTimersByTime(2500)
    expect(isPetted.value).toBe(false)
    expect(mood.value).toBe('idle')
  })

  it('switches mood to focus when timer is running in work mode', () => {
    const focusStore = useFocusStore()
    const { mood } = useCatCompanion()

    focusStore.mode = 'work'
    focusStore.isRunning = true

    expect(mood.value).toBe('focus')

    focusStore.isRunning = false
    expect(mood.value).toBe('idle')
  })

  it('switches mood to break when timer is running in break mode', () => {
    const focusStore = useFocusStore()
    const { mood } = useCatCompanion()

    focusStore.mode = 'shortBreak'
    focusStore.isRunning = true

    expect(mood.value).toBe('break')
  })

  it('toggles companion visibility and settings', () => {
    const { settings, toggleCompanion, toggleSound, toggleMinimize, setTheme } = useCatCompanion()

    toggleCompanion()
    expect(settings.value.enabled).toBe(false)

    toggleCompanion()
    expect(settings.value.enabled).toBe(true)

    const initialSound = settings.value.soundEnabled
    toggleSound()
    expect(settings.value.soundEnabled).toBe(!initialSound)

    toggleMinimize()
    expect(settings.value.isMinimized).toBe(true)

    setTheme('calico')
    expect(settings.value.theme).toBe('calico')
  })
})
