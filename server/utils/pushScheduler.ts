import webPush from 'web-push'
import { getVapidKeys } from './vapid'
import { redisGet, redisSet } from './redis'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
}

interface PushTimerEntry {
  timeoutId: NodeJS.Timeout
  targetEndTimestamp: number
  subscriptions: webPush.PushSubscription[]
  payload: PushNotificationPayload
}

const scheduledPushTimers = new Map<string, PushTimerEntry>()

const MAX_SUBS_PER_USER = 5
const MAX_ENDPOINT_LENGTH = 2048

/**
 * Audit H2: only genuine browser push services may be targeted. Without this,
 * an unauthenticated POST to /api/push/subscribe plus a focus-session POST
 * turned the server into a blind SSRF proxy to arbitrary hosts (including
 * 127.0.0.1 / internal metadata endpoints).
 */
const ALLOWED_PUSH_HOSTS = [
  'fcm.googleapis.com',
  'android.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'notify.windows.com',
  'push.apple.com',
  'web.push.apple.com'
]

export function isAllowedPushEndpoint(endpoint: unknown): boolean {
  if (typeof endpoint !== 'string' || endpoint.length === 0 || endpoint.length > MAX_ENDPOINT_LENGTH) {
    return false
  }
  let parsed: URL
  try {
    parsed = new URL(endpoint)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  const host = parsed.hostname.toLowerCase()
  // Reject bare IP literals and loopback outright, even before the allowlist.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host === 'localhost' || host.endsWith('.local')) {
    return false
  }
  return ALLOWED_PUSH_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))
}

/** Per-user subscription key -- subscriptions are never shared across tenants. */
function pushSubsKey(userId: string): string {
  return `neuralflow:push_subscriptions:${String(userId).replace(/[^A-Za-z0-9_-]/g, '')}`
}

export async function storePushSubscription(
  userId: string,
  subscription: webPush.PushSubscription
): Promise<void> {
  if (!isAllowedPushEndpoint(subscription?.endpoint)) return

  const key = pushSubsKey(userId)
  const { data: existing } = await redisGet<webPush.PushSubscription[]>(key)
  const subscriptions = Array.isArray(existing) ? existing : []

  const filtered = subscriptions.filter((sub) => sub.endpoint !== subscription.endpoint)
  filtered.push({
    endpoint: subscription.endpoint,
    keys: subscription.keys
  })

  // Cap per-user subscriptions to bound storage growth.
  await redisSet(key, filtered.slice(-MAX_SUBS_PER_USER))
}

export async function getStoredPushSubscriptions(userId: string): Promise<webPush.PushSubscription[]> {
  const { data: existing } = await redisGet<webPush.PushSubscription[]>(pushSubsKey(userId))
  return Array.isArray(existing) ? existing : []
}

/**
 * Timers are keyed by user-scoped session id (see focus/session.post.ts), so
 * cancelling one tenant's timer can never affect another's.
 */
export function cancelPushTimer(sessionId: string): boolean {
  const existing = scheduledPushTimers.get(sessionId)
  if (existing) {
    clearTimeout(existing.timeoutId)
    scheduledPushTimers.delete(sessionId)
    return true
  }
  return false
}

export async function sendWebPush(
  subscription: webPush.PushSubscription,
  payload: PushNotificationPayload | string
): Promise<boolean> {
  try {
    if (!isAllowedPushEndpoint(subscription?.endpoint)) return false
    getVapidKeys()
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload)
    await webPush.sendNotification(subscription, payloadStr)
    return true
  } catch {
    // Never log the full endpoint (it is a credential-bearing capability URL).
    return false
  }
}

export async function schedulePushTimer(
  sessionId: string,
  targetEndTimestamp: number,
  payload: PushNotificationPayload,
  userId: string,
  subscription?: webPush.PushSubscription
): Promise<void> {
  cancelPushTimer(sessionId)

  const delayMs = targetEndTimestamp - Date.now()

  let subsToNotify: webPush.PushSubscription[] = []
  if (subscription && isAllowedPushEndpoint(subscription.endpoint)) {
    subsToNotify = [subscription]
  } else {
    subsToNotify = await getStoredPushSubscriptions(userId)
  }

  if (subsToNotify.length === 0) return

  const triggerPush = async () => {
    scheduledPushTimers.delete(sessionId)
    for (const sub of subsToNotify) {
      await sendWebPush(sub, payload)
    }
  }

  if (delayMs <= 0) {
    await triggerPush()
    return
  }

  // Bound the timer duration so a far-future timestamp cannot pin resources.
  const MAX_TIMER_MS = 25 * 60 * 60 * 1000
  if (delayMs > MAX_TIMER_MS) return

  const timeoutId = setTimeout(triggerPush, delayMs)

  scheduledPushTimers.set(sessionId, {
    timeoutId,
    targetEndTimestamp,
    subscriptions: subsToNotify,
    payload
  })
}
