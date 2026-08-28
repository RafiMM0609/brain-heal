export function useAudioNotification() {
  let audioCtx: AudioContext | null = null
  let currentPushSubscription: PushSubscription | null = null

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

  // Helper to convert VAPID base64 key to Uint8Array
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Register Service Worker and subscribe to Web Push Notifications
  async function setupWebPush(): Promise<PushSubscription | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null
    }

    try {
      // Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Check existing subscription
      let sub = await registration.pushManager.getSubscription()
      if (!sub) {
        // Fetch VAPID Public Key from Nitro Server
        const { publicKey } = await $fetch<{ publicKey: string }>('/api/push/vapid-key')
        if (publicKey) {
          const applicationServerKey = urlBase64ToUint8Array(publicKey)
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as unknown as BufferSource
          })
        }
      }

      if (sub) {
        currentPushSubscription = sub
        // Send subscription to server
        await $fetch('/api/push/subscribe', {
          method: 'POST',
          body: sub.toJSON()
        }).catch(() => {})
      }

      return sub
    } catch (err) {
      console.warn('[WebPush] Service Worker or Push Subscription failed:', err)
      return null
    }
  }

  // Request browser Web Notification permission & set up Web Push
  async function requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const perm = await Notification.requestPermission()
          if (perm === 'granted') {
            await setupWebPush()
          }
        } catch (e) {
          console.warn('[AudioNotification] Notification permission error:', e)
        }
      } else if (Notification.permission === 'granted') {
        await setupWebPush()
      }
    }
  }

  // Send desktop/PWA notification locally
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

  function getPushSubscriptionJSON() {
    return currentPushSubscription ? currentPushSubscription.toJSON() : null
  }

  return {
    playCompletionChime,
    requestNotificationPermission,
    sendNotification,
    setupWebPush,
    getPushSubscriptionJSON
  }
}
