import webPush from 'web-push'
import { getVapidKeys } from './vapid'
import { redisGet, redisSet } from './redis'

interface PushTimerEntry {
  timeoutId: NodeJS.Timeout
  targetEndTimestamp: number
  subscription: webPush.PushSubscription
  payload: {
    title: string
    body: string
    icon?: string
    badge?: string
    url?: string
  }
}

const scheduledPushTimers = new Map<string, PushTimerEntry>()

export const REDIS_PUSH_SUBS_KEY = 'neuralflow:push_subscriptions'

export async function storePushSubscription(subscription: webPush.PushSubscription): Promise<void> {
  const { data: existing } = await redisGet<webPush.PushSubscription[]>(REDIS_PUSH_SUBS_KEY)
  const subscriptions = Array.isArray(existing) ? existing : []
  
  // Deduplicate by endpoint
  const filtered = subscriptions.filter(sub => sub.endpoint !== subscription.endpoint)
  filtered.push(subscription)
  
  await redisSet(REDIS_PUSH_SUBS_KEY, filtered)
}

export async function getStoredPushSubscriptions(): Promise<webPush.PushSubscription[]> {
  const { data: existing } = await redisGet<webPush.PushSubscription[]>(REDIS_PUSH_SUBS_KEY)
  return Array.isArray(existing) ? existing : []
}

export function cancelPushTimer(sessionId: string): boolean {
  const existing = scheduledPushTimers.get(sessionId)
  if (existing) {
    clearTimeout(existing.timeoutId)
    scheduledPushTimers.delete(sessionId)
    console.log(`[PushScheduler] Canceled scheduled push notification for session "${sessionId}" (Timer Paused/Stopped).`)
    return true
  }
  return false
}

export async function sendWebPush(subscription: webPush.PushSubscription, payload: any): Promise<boolean> {
  try {
    getVapidKeys() // Ensure VAPID keys are initialized
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload)
    await webPush.sendNotification(subscription, payloadStr)
    console.log('[PushScheduler] Web push notification delivered successfully to endpoint:', subscription.endpoint.slice(-20))
    return true
  } catch (err: any) {
    console.error('[PushScheduler] Failed to deliver web push notification:', err?.message || err)
    return false
  }
}

export async function schedulePushTimer(
  sessionId: string,
  targetEndTimestamp: number,
  payload: { title: string; body: string; icon?: string; badge?: string; url?: string },
  subscription?: webPush.PushSubscription
): Promise<void> {
  // Cancel any prior timer for this session
  cancelPushTimer(sessionId)

  const delayMs = targetEndTimestamp - Date.now()

  // Target subscriptions
  let subsToNotify: webPush.PushSubscription[] = []
  if (subscription) {
    subsToNotify = [subscription]
  } else {
    subsToNotify = await getStoredPushSubscriptions()
  }

  if (subsToNotify.length === 0) {
    console.warn('[PushScheduler] No push subscriptions found to schedule push notification.')
    return
  }

  const triggerPush = async () => {
    scheduledPushTimers.delete(sessionId)
    console.log(`[PushScheduler] Triggering timer push completion notification for session "${sessionId}"!`)
    for (const sub of subsToNotify) {
      await sendWebPush(sub, payload)
    }
  }

  if (delayMs <= 0) {
    await triggerPush()
    return
  }

  console.log(`[PushScheduler] Scheduled push notification for session "${sessionId}" in ${Math.round(delayMs / 1000)}s`)

  const timeoutId = setTimeout(triggerPush, delayMs)
  
  scheduledPushTimers.set(sessionId, {
    timeoutId,
    targetEndTimestamp,
    subscription: subsToNotify[0],
    payload
  })
}
