export function useAudioNotification() {
  let audioCtx: AudioContext | null = null

  function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        audioCtx = new AudioCtx()
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  }

  // Play a pleasant, soothing multi-tone chime (C5 - E5 - G5 harmonic bell)
  function playCompletionChime() {
    try {
      const ctx = getAudioContext()
      if (!ctx) return

      const now = ctx.currentTime
      const tones = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 notes

      tones.forEach((freq, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + index * 0.1)

        // Soft attack & exponential decay for bell effect
        gain.gain.setValueAtTime(0.001, now + index * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.2, now + index * 0.1 + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 1.2)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now + index * 0.1)
        osc.stop(now + index * 0.1 + 1.3)
      })

      // Trigger navigator vibration for haptic feedback
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300])
      }
    } catch (e) {
      console.warn('[AudioNotification] Audio synthesis failed:', e)
    }
  }

  // Request browser Web Notification permission
  async function requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission()
        } catch (e) {
          console.warn('[AudioNotification] Notification permission error:', e)
        }
      }
    }
  }

  // Send desktop/PWA notification
  function sendNotification(title: string, body: string) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            silent: false
          })
        } catch (e) {
          console.warn('[AudioNotification] Notification trigger error:', e)
        }
      }
    }
  }

  return {
    playCompletionChime,
    requestNotificationPermission,
    sendNotification
  }
}
