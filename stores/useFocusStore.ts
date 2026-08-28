import { defineStore } from 'pinia'
import type { FocusMode, FocusSession } from '~/types/focus'

export const useFocusStore = defineStore('focus', () => {
  const activeTaskId = ref<string | null>('task-1')
  const activeTaskTitle = ref<string>('Finalize Q3 Strategy Deck')

  const mode = ref<FocusMode>('work')
  const durationSeconds = ref<number>(25 * 60) // 25 minutes default
  const elapsedSeconds = ref<number>(0)
  const isRunning = ref<boolean>(false)
  const timerInterval = ref<any>(null)
  const targetEndTimestamp = ref<number | null>(null)
  const isDistractionDumpOpen = ref<boolean>(false)
  const isRecoveryRequired = ref<boolean>(false)

  const { playCompletionChime, sendNotification, requestNotificationPermission, getPushSubscriptionJSON, setupWebPush } = useAudioNotification()

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
      const res = await $fetch<{ session: FocusSession | null }>('/api/focus/session')
      if (res && res.session) {
        if (res.session.taskId) activeTaskId.value = res.session.taskId
        if (res.session.taskTitle) activeTaskTitle.value = res.session.taskTitle
        if (res.session.mode) mode.value = res.session.mode
        if (res.session.durationSeconds) durationSeconds.value = res.session.durationSeconds
        if (res.session.elapsedSeconds !== undefined) elapsedSeconds.value = res.session.elapsedSeconds

        if (res.session.isRunning && res.session.targetEndTimestamp) {
          targetEndTimestamp.value = res.session.targetEndTimestamp
          startTimerLocalOnly()
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
      await $fetch('/api/focus/session', {
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
    } catch (err) {
      console.error('[FocusStore] Failed to sync focus session:', err)
    }
  }

  function setFocusTask(id: string, title: string) {
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
    if (timerInterval.value) clearInterval(timerInterval.value)

    if (!timerWorker && import.meta.client) {
      timerWorker = initWorker()
    }

    if (timerWorker) {
      timerWorker.postMessage('start')
    }

    // Fallback interval for environments without worker support
    timerInterval.value = setInterval(() => {
      updateElapsedFromWallClock()
    }, 500)

    updateElapsedFromWallClock()
  }

  function pauseTimerLocalOnly() {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    if (timerWorker) {
      timerWorker.postMessage('stop')
    }
    isRunning.value = false
    targetEndTimestamp.value = null
  }

  async function startTimer() {
    if (isRunning.value) return
    await requestNotificationPermission()
    
    // Set target end time based on remaining duration
    const remainingSecs = durationSeconds.value - elapsedSeconds.value
    targetEndTimestamp.value = Date.now() + remainingSecs * 1000

    startTimerLocalOnly()
    await syncSession()
  }

  function pauseTimer() {
    pauseTimerLocalOnly()
    syncSession()
  }

  function stopTimer() {
    pauseTimerLocalOnly()
    elapsedSeconds.value = 0
    syncSession()
  }

  function skipTimer() {
    pauseTimer()
    completeTimer()
  }

  function completeTimer() {
    pauseTimer()
    syncSession(true)
    
    // Sound chime & haptic vibration
    playCompletionChime()
    
    const notificationTitle = mode.value === 'work' ? 'Focus Session Completed! 🎯' : 'Break Time Ended! ⚡'
    const notificationBody = mode.value === 'work' ? `Great job on "${activeTaskTitle.value}"! Time for a recharge break.` : 'Ready to dive back into deep work?'
    sendNotification(notificationTitle, notificationBody)

    if (mode.value === 'work') {
      isRecoveryRequired.value = true
      const router = useRouter()
      router.push('/recovery')
    }
  }

  function toggleDistractionDump() {
    isDistractionDumpOpen.value = !isDistractionDumpOpen.value
  }

  function setMode(newMode: FocusMode, minutes: number) {
    pauseTimer()
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
    isRunning,
    isDistractionDumpOpen,
    isRecoveryRequired,
    fetchSession,
    setFocusTask,
    updateElapsedFromWallClock,
    startTimer,
    pauseTimer,
    stopTimer,
    skipTimer,
    toggleDistractionDump,
    setMode
  }
})
