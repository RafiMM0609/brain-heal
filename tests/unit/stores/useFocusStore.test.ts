import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    apiFetch: vi.fn().mockResolvedValue({ session: null })
  }),
  getClientId: () => 'test-client-id'
}))

vi.mock('~/composables/useAudioNotification', () => ({
  useAudioNotification: () => ({
    playCompletionChime: vi.fn(),
    sendNotification: vi.fn(),
    requestNotificationPermission: vi.fn().mockResolvedValue(true),
    getPushSubscriptionJSON: vi.fn().mockReturnValue(null)
  })
}))

import { useFocusStore } from '~/stores/useFocusStore'

describe('stores/useFocusStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default 25-minute Pomodoro mode', () => {
    const store = useFocusStore()
    expect(store.mode).toBe('work')
    expect(store.durationSeconds).toBe(25 * 60)
    expect(store.elapsedSeconds).toBe(0)
    expect(store.remainingSeconds).toBe(25 * 60)
    expect(store.formattedTime).toBe('25:00')
    expect(store.progressPercent).toBe(0)
  })

  it('updates formattedTime and progressPercent when elapsedSeconds changes', () => {
    const store = useFocusStore()
    store.elapsedSeconds = 5 * 60 // 5 minutes elapsed

    expect(store.remainingSeconds).toBe(20 * 60)
    expect(store.formattedTime).toBe('20:00')
    expect(store.progressPercent).toBe(20) // 5/25 = 20%
  })

  it('formats remaining single digits seconds with leading zeroes', () => {
    const store = useFocusStore()
    store.elapsedSeconds = 24 * 60 + 55 // 5 seconds remaining
    expect(store.formattedTime).toBe('00:05')
  })

  it('changes mode and resets elapsed time via setMode', () => {
    const store = useFocusStore()
    store.elapsedSeconds = 120

    store.setMode('shortBreak', 5)
    expect(store.mode).toBe('shortBreak')
    expect(store.durationSeconds).toBe(5 * 60)
    expect(store.elapsedSeconds).toBe(0)
    expect(store.formattedTime).toBe('05:00')
  })

  it('manages cognitive energy points within limits (0 - 4)', () => {
    const store = useFocusStore()
    store.resetEnergyPoints()
    expect(store.energyPoints).toBe(0)

    store.addEnergyPoints(2)
    expect(store.energyPoints).toBe(2)

    store.addEnergyPoints(3) // 2 + 3 = 5, but capped at 4
    expect(store.energyPoints).toBe(4)

    store.resetEnergyPoints()
    expect(store.energyPoints).toBe(0)
    expect(store.isRecoveryRequired).toBe(false)
  })

  it('updates active task via setFocusTask', () => {
    const store = useFocusStore()
    store.setFocusTask('task-888', 'Refactor Microservices')

    expect(store.activeTaskId).toBe('task-888')
    expect(store.activeTaskTitle).toBe('Refactor Microservices')
  })
})
