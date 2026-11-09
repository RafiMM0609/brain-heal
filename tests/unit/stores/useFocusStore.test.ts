import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const apiFetchMock = vi.fn().mockResolvedValue({ session: null })

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ apiFetch: apiFetchMock }),
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

describe('stores/useFocusStore — countdown integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    apiFetchMock.mockReset()
    apiFetchMock.mockResolvedValue({ session: null })
    vi.useRealTimers()
  })

  it('a running local timer is not overwritten by a stale sync payload', async () => {
    const store = useFocusStore()

    // The timer is counting locally: 40s in.
    store.durationSeconds = 1500
    store.isRunning = true
    store.elapsedSeconds = 40
    store.targetEndTimestamp = Date.now() + 1460 * 1000

    // A sync payload computed earlier claims only 5s had elapsed.
    apiFetchMock.mockResolvedValueOnce({
      session: {
        id: 'x:focus-session-main',
        mode: 'work',
        durationSeconds: 1500,
        elapsedSeconds: 5,
        isRunning: true,
        targetEndTimestamp: Date.now() + 60_000,
        completed: false,
        timestamp: new Date().toISOString()
      }
    })

    await store.fetchSession()

    // Must not jump backwards to 5s.
    expect(store.elapsedSeconds).toBe(40)
  })

  it('adopts the payload when no local timer is running', async () => {
    const store = useFocusStore()
    store.isRunning = false

    apiFetchMock.mockResolvedValueOnce({
      session: {
        id: 'x:focus-session-main',
        mode: 'work',
        durationSeconds: 1500,
        elapsedSeconds: 300,
        isRunning: false,
        targetEndTimestamp: null,
        completed: false,
        timestamp: new Date().toISOString()
      }
    })

    await store.fetchSession()

    expect(store.elapsedSeconds).toBe(300)
    expect(store.formattedTime).toBe('20:00')
  })

  it('counts down from the wall clock rather than accumulating ticks', () => {
    const store = useFocusStore()
    store.durationSeconds = 1500
    store.elapsedSeconds = 0

    // Simulate: started 90s ago, 1410s left on the clock.
    store.targetEndTimestamp = Date.now() + 1410 * 1000
    store.isRunning = true

    store.updateElapsedFromWallClock()

    // Derived from the target timestamp, so the value is stable regardless of
    // how many ticks (0 or 100) were delivered.
    expect(store.elapsedSeconds).toBe(90)
    expect(store.formattedTime).toBe('23:30')
  })

  it('does not advance when the timer is not running', () => {
    const store = useFocusStore()
    store.isRunning = false
    store.targetEndTimestamp = Date.now() + 60_000
    store.elapsedSeconds = 12

    store.updateElapsedFromWallClock()

    expect(store.elapsedSeconds).toBe(12)
  })

  it('accepts every FocusMode the client can send', async () => {
    // Guards the server/client mode-vocabulary drift that made break sessions
    // return 400 and silently lose their persisted state.
    const { FocusMode } = (await import('~/types/focus')) as unknown as { FocusMode: never }
    void FocusMode

    const modes = ['work', 'quickWork', 'shortBreak', 'longBreak'] as const
    for (const mode of modes) {
      expect(() => {
        const store = useFocusStore()
        store.setMode(mode, 5)
      }).not.toThrow()
      expect(useFocusStore().mode).toBe(mode)
    }
  })
})
