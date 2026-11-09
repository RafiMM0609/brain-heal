import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { useAudioNotification } from '~/composables/useAudioNotification'
import type { FocusMode, FocusSession } from '~/types/focus'

export const useFocusStore = defineStore('focus', () => {
  const { apiFetch } = useApi()
  // Empty until the user (or a restored session) picks a task. This used to be
  // hardcoded to a demo task, which leaked a fake title into the tab title and
  // the focus header for visitors without a session.
  const activeTaskId = ref<string | null>(null)
  const activeTaskTitle = ref<string>('')

  const mode = ref<FocusMode>('work')
  const durationSeconds = ref<number>(25 * 60) // 25 minutes default
  const elapsedSeconds = ref<number>(0)
  const isRunning = ref<boolean>(false)
  const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const targetEndTimestamp = ref<number | null>(null)
  const isDistractionDumpOpen = ref<boolean>(false)
  const isMentalClosureOpen = ref<boolean>(false)
  const closureTaskData = ref<{ id: string | null; title: string; sessionMinutes: number } | null>(null)
  const isRecoveryRequired = ref<boolean>(false)
  const lastLocalActionTimestamp = ref<number>(0)

  function openMentalClosure(task?: { id?: string | null; title?: string; sessionMinutes?: number }) {
    pauseTimerLocalOnly()
    isMentalClosureOpen.value = true
    closureTaskData.value = {
      id: task?.id ?? activeTaskId.value,
      title: task?.title ?? activeTaskTitle.value ?? 'Focus Task',
      sessionMinutes: task?.sessionMinutes ?? Math.max(1, Math.round(elapsedSeconds.value / 60) || Math.round(durationSeconds.value / 60))
    }
  }

  function closeMentalClosure() {
    isMentalClosureOpen.value = false
    closureTaskData.value = null
  }

  const energyPoints = ref<number>(0)
  const maxEnergyPoints = ref<number>(4)

  if (import.meta.client) {
    const savedPoints = localStorage.getItem('brain_heal_energy_points')
    if (savedPoints !== null) {
      energyPoints.value = Math.min(4, Math.max(0, parseInt(savedPoints, 10) || 0))
    }
  }

  function addEnergyPoints(pts: number) {
    energyPoints.value = Math.min(maxEnergyPoints.value, energyPoints.value + pts)
    if (import.meta.client) {
      localStorage.setItem('brain_heal_energy_points', energyPoints.value.toString())
    }
  }

  function resetEnergyPoints() {
    energyPoints.value = 0
    isRecoveryRequired.value = false
    if (import.meta.client) {
      localStorage.setItem('brain_heal_energy_points', '0')
    }
  }

  const { playCompletionChime, sendNotification, requestNotificationPermission, getPushSubscriptionJSON } = useAudioNotification()

  const remainingSeconds = computed(() => Math.max(0, durationSeconds.value - elapsedSeconds.value))
  
  const formattedTime = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60)
    const secs = remainingSeconds.value % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  })

  const progressPercent = computed(() => {
    if (durationSeconds.value === 0) return 0
    return Math.min(100, Math.round((elapsedSeconds.value / durationSeconds.value) * 100))
  })

  async function fetchSession() {
    try {
      const res = await apiFetch<{ session: FocusSession | null }>('/api/focus/session')
      if (res && res.session) {
        if (res.session.timestamp) {
          const serverTime = new Date(res.session.timestamp).getTime()
          if (serverTime < lastLocalActionTimestamp.value) {
            return // Ignore stale server session data
          }
        }
        if (res.session.taskId) activeTaskId.value = res.session.taskId
        if (res.session.taskTitle) activeTaskTitle.value = res.session.taskTitle
        if (res.session.mode) mode.value = res.session.mode
        if (res.session.durationSeconds) durationSeconds.value = res.session.durationSeconds
        // A running local timer is authoritative for both elapsed time and the
        // target timestamp, because everything displayed is derived from the
        // target. Adopting the payload's target here made the countdown jump
        // (e.g. 40s elapsed became 1440s) whenever a sync arrived mid-session.
        const localIsCounting = isRunning.value && targetEndTimestamp.value !== null
        if (!localIsCounting && res.session.elapsedSeconds !== undefined) {
          elapsedSeconds.value = res.session.elapsedSeconds
        }

        if (res.session.isRunning && res.session.targetEndTimestamp) {
          if (!localIsCounting) {
            targetEndTimestamp.value = res.session.targetEndTimestamp
            startTimerLocalOnly()
          } else {
            // Same session, already counting: re-derive instead of re-targeting.
            updateElapsedFromWallClock()
          }
        } else if (res.session.isRunning === false && isRunning.value) {
          pauseTimerLocalOnly()
        }
      }
    } catch (err) {
      console.error('[FocusStore] Failed to fetch focus session:', err)
    }
  }

  async function syncSession(completed = false) {
    try {
      const pushSubscription = getPushSubscriptionJSON()
      const res = await apiFetch<{ session: FocusSession }>('/api/focus/session', {
        method: 'POST',
        body: {
          taskId: activeTaskId.value || undefined,
          taskTitle: activeTaskTitle.value || undefined,
          mode: mode.value,
          durationSeconds: durationSeconds.value,
          elapsedSeconds: elapsedSeconds.value,
          isRunning: isRunning.value,
          targetEndTimestamp: targetEndTimestamp.value,
          completed,
          pushSubscription
        }
      })
      if (res && res.session && res.session.timestamp) {
        lastLocalActionTimestamp.value = new Date(res.session.timestamp).getTime()
      }
    } catch (err) {
      console.error('[FocusStore] Failed to sync focus session:', err)
    }
  }

  function setFocusTask(id: string, title: string) {
    lastLocalActionTimestamp.value = Date.now()
    activeTaskId.value = id
    activeTaskTitle.value = title
    syncSession()
  }

  function updateElapsedFromWallClock() {
    if (!isRunning.value || !targetEndTimestamp.value) return
    const remainingMs = targetEndTimestamp.value - Date.now()
    const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000))
    const calculatedElapsed = Math.min(durationSeconds.value, Math.max(0, durationSeconds.value - remainingSecs))
    elapsedSeconds.value = calculatedElapsed

    if (remainingSecs <= 0) {
      completeTimer()
    }
  }

  let timerWorker: Worker | null = null
  let lastTickAt = 0

  function initWorker() {
    if (!import.meta.client || typeof Worker === 'undefined') return null
    try {
      const code = `
        let intervalId = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(function() { self.postMessage('tick'); }, 500);
          } else if (e.data === 'stop') {
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
          }
        };
      `
      const blob = new Blob([code], { type: 'application/javascript' })
      const worker = new Worker(URL.createObjectURL(blob))
      worker.onmessage = (e) => {
        if (e.data === 'tick') {
          lastTickAt = Date.now()
          updateElapsedFromWallClock()
        }
      }
      return worker
    } catch (err) {
      console.warn('[FocusStore] Web Worker timer initialization failed:', err)
      return null
    }
  }

  function startTimerLocalOnly() {
    isRunning.value = true
    lastTickAt = 0
    if (timerInterval.value) clearInterval(timerInterval.value)

    // `initWorker()` returns null when Worker is unavailable. It can also
    // "succeed" while the blob script is blocked by CSP, in which case no tick
    // ever arrives. `startIntervalFallback()` therefore also arms a plain
    // setInterval whenever the worker fails to prove it is alive, so the
    // countdown can never be left silently frozen.
    if (!timerWorker && import.meta.client) {
      timerWorker = initWorker()
    }

    if (timerWorker) {
      timerWorker.postMessage('start')
      armFallbackWatchdog()
    } else {
      startIntervalFallback()
    }

    updateElapsedFromWallClock()
  }

  function startIntervalFallback() {
    if (timerInterval.value) clearInterval(timerInterval.value)
    timerInterval.value = setInterval(() => {
      updateElapsedFromWallClock()
    }, 500)
  }

  let fallbackWatchdog: ReturnType<typeof setTimeout> | null = null

  /**
   * A Worker whose script is blocked (e.g. by a Content-Security-Policy that
   * lacks `worker-src blob:`) still constructs without throwing — it simply
   * never posts a tick. If no tick arrives shortly after starting, switch to the
   * interval fallback.
   */
  function armFallbackWatchdog() {
    if (fallbackWatchdog) clearTimeout(fallbackWatchdog)
    fallbackWatchdog = setTimeout(() => {
      fallbackWatchdog = null
      if (isRunning.value && !lastTickAt) {
        console.warn('[FocusStore] Timer worker produced no ticks; using interval fallback.')
        startIntervalFallback()
      }
    }, 1200)
  }

  function pauseTimerLocalOnly() {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    if (timerWorker) {
      timerWorker.postMessage('stop')
    }
    if (fallbackWatchdog) {
      clearTimeout(fallbackWatchdog)
      fallbackWatchdog = null
    }
    lastTickAt = 0
    isRunning.value = false
    targetEndTimestamp.value = null
  }

  async function startTimer() {
    if (isRunning.value) return

    // Start counting first, then ask for notification permission. Awaiting the
    // permission prompt here meant the countdown stayed frozen at 25:00 until
    // the user answered the dialog (or forever, if it was dismissed).
    lastLocalActionTimestamp.value = Date.now()
    // Set target end time based on remaining duration
    const remainingSecs = durationSeconds.value - elapsedSeconds.value
    targetEndTimestamp.value = Date.now() + remainingSecs * 1000

    startTimerLocalOnly()
    await syncSession()

    // Fire-and-forget: never blocks the countdown.
    requestNotificationPermission().catch(() => {})
  }

  function pauseTimer() {
    lastLocalActionTimestamp.value = Date.now()
    pauseTimerLocalOnly()
    syncSession()
  }

  function stopTimer() {
    lastLocalActionTimestamp.value = Date.now()
    pauseTimerLocalOnly()
    elapsedSeconds.value = 0
    syncSession()
  }

  function skipTimer() {
    lastLocalActionTimestamp.value = Date.now()
    pauseTimerLocalOnly()
    completeTimer()
  }

  function completeTimer() {
    lastLocalActionTimestamp.value = Date.now()
    pauseTimerLocalOnly()
    syncSession(true)
    
    // Sound chime & haptic vibration
    playCompletionChime()
    
    const isWorkSession = mode.value === 'work' || mode.value === 'quickWork'

    if (isWorkSession) {
      const ptsToAdd = mode.value === 'work' ? 2 : 1
      addEnergyPoints(ptsToAdd)
    }

    const notificationTitle = isWorkSession
      ? (mode.value === 'work' ? 'Deep Work Completed! 🎯' : 'Quick Work Completed! ⚡')
      : 'Break Time Ended! ⚡'
    const notificationBody = isWorkSession
      ? `Great job on "${activeTaskTitle.value}"! (${energyPoints.value}/${maxEnergyPoints.value} Cognitive Energy Points)`
      : 'Ready to dive back into focus?'
    sendNotification(notificationTitle, notificationBody)

    if (isWorkSession) {
      openMentalClosure({
        id: activeTaskId.value,
        title: activeTaskTitle.value || 'Focus Task',
        sessionMinutes: Math.round(durationSeconds.value / 60)
      })
    }

    if (isWorkSession && energyPoints.value >= maxEnergyPoints.value) {
      isRecoveryRequired.value = true
    }
  }

  function openDistractionDump() {
    isDistractionDumpOpen.value = true
    if (import.meta.client) {
      const focusTarget = () => {
        const el = document.getElementById('instant-dump-input') as HTMLInputElement | null
        if (el) {
          el.focus()
          el.click()
        }
      }
      focusTarget()
      requestAnimationFrame(focusTarget)
      setTimeout(focusTarget, 50)
    }
  }

  function toggleDistractionDump() {
    if (isDistractionDumpOpen.value) {
      isDistractionDumpOpen.value = false
    } else {
      openDistractionDump()
    }
  }

  function setMode(newMode: FocusMode, minutes: number) {
    lastLocalActionTimestamp.value = Date.now()
    pauseTimerLocalOnly()
    mode.value = newMode
    durationSeconds.value = minutes * 60
    elapsedSeconds.value = 0
    syncSession()
  }

  if (import.meta.client) {
    fetchSession()
    
    // Handle tab visibility change (iOS Safari wake-up from background)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isRunning.value) {
        updateElapsedFromWallClock()
      }
    })
  }

  return {
    activeTaskId,
    activeTaskTitle,
    mode,
    durationSeconds,
    elapsedSeconds,
    remainingSeconds,
    formattedTime,
    progressPercent,
    targetEndTimestamp,
    isRunning,
    isDistractionDumpOpen,
    isMentalClosureOpen,
    closureTaskData,
    isRecoveryRequired,
    energyPoints,
    maxEnergyPoints,
    resetEnergyPoints,
    addEnergyPoints,
    fetchSession,
    setFocusTask,
    updateElapsedFromWallClock,
    startTimer,
    pauseTimer,
    stopTimer,
    skipTimer,
    openDistractionDump,
    toggleDistractionDump,
    openMentalClosure,
    closeMentalClosure,
    setMode
  }
})
