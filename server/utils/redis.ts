import { Redis } from '@upstash/redis'
import type { TaskItem } from '~/types/task'

let redisInstance: Redis | null = null
let currentConfiguredUrl: string | null = null

export const REDIS_KEYS = {
  TASKS: 'neuralflow:tasks',
  DISTRACTIONS: 'neuralflow:distractions',
  FOCUS_SESSION: 'neuralflow:focus_session',
  SHARE: 'neuralflow:share_items',
  USERS: 'neuralflow:users',
  PUSH_SUBS: 'neuralflow:push_subscriptions',
  RATE_LIMIT: 'neuralflow:ratelimit'
}

export const DEFAULT_TASKS: TaskItem[] = [
  { id: 'task-1', title: 'Finalize Q3 Strategy Deck', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-2', title: 'Reply to vendor emails', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-3', title: 'Schedule dentist appointment', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-4', title: 'Read industry newsletter', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-5', title: 'Fix urgent server bug', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false }
]

// TTL bookkeeping for the in-memory fallback (real Redis handles TTL natively).
const inMemoryExpiry: Record<string, number> = {}
const inMemoryStore: Record<string, unknown> = {}

export function getRedisClient(): Redis | null {
  let url = ''
  let token = ''

  try {
    const config = useRuntimeConfig()
    url = config.upstashRedisRestUrl || ''
    token = config.upstashRedisRestToken || ''
  } catch {
    // If called outside Nitro event context
  }

  url = url || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
  token = token || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''

  if (!url || !token) {
    return null
  }

  if (redisInstance && currentConfiguredUrl === url) {
    return redisInstance
  }

  try {
    redisInstance = new Redis({ url, token })
    currentConfiguredUrl = url
    return redisInstance
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[Redis] Error creating Upstash Redis client:', errorMsg)
    return null
  }
}

export async function redisGet<T>(key: string): Promise<{ data: T | null; isFallback: boolean }> {
  const client = getRedisClient()
  if (client) {
    try {
      const value = await client.get<T>(key)
      return { data: value !== undefined ? value : null, isFallback: false }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[Redis] Error getting key "${key}":`, errorMsg)
    }
  }

  const expiresAt = inMemoryExpiry[key]
  if (expiresAt !== undefined && expiresAt < Date.now()) {
    Reflect.deleteProperty(inMemoryStore, key)
    Reflect.deleteProperty(inMemoryExpiry, key)
    return { data: null, isFallback: true }
  }

  const fallbackData = (inMemoryStore[key] !== undefined ? inMemoryStore[key] : null) as T | null
  return { data: fallbackData, isFallback: true }
}

export async function redisSet<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<{ success: boolean; isFallback: boolean }> {
  const client = getRedisClient()
  if (client) {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, value, { ex: ttlSeconds })
      } else {
        await client.set(key, value)
      }
      return { success: true, isFallback: false }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[Redis] Error setting key "${key}":`, errorMsg)
    }
  }

  inMemoryStore[key] = value
  if (ttlSeconds && ttlSeconds > 0) {
    inMemoryExpiry[key] = Date.now() + ttlSeconds * 1000
  } else {
    Reflect.deleteProperty(inMemoryExpiry, key)
  }
  return { success: true, isFallback: true }
}

export async function redisDel(key: string): Promise<{ success: boolean; isFallback: boolean }> {
  const client = getRedisClient()
  if (client) {
    try {
      await client.del(key)
      return { success: true, isFallback: false }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[Redis] Error deleting key "${key}":`, errorMsg)
    }
  }
  Reflect.deleteProperty(inMemoryStore, key)
  Reflect.deleteProperty(inMemoryExpiry, key)
  return { success: true, isFallback: true }
}

/**
 * Atomically bump a counter and return the new value within a fixed window.
 */
export async function redisIncrWindow(
  key: string,
  windowSeconds: number
): Promise<{ count: number; isFallback: boolean }> {
  const client = getRedisClient()
  if (client) {
    try {
      const count = await client.incr(key)
      if (count === 1) {
        await client.expire(key, windowSeconds)
      }
      return { count, isFallback: false }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[Redis] Error incrementing key "${key}":`, errorMsg)
    }
  }

  const now = Date.now()
  const expiresAt = inMemoryExpiry[key]
  if (expiresAt === undefined || expiresAt < now) {
    inMemoryStore[key] = 1
    inMemoryExpiry[key] = now + windowSeconds * 1000
    return { count: 1, isFallback: true }
  }
  const next = Number(inMemoryStore[key] || 0) + 1
  inMemoryStore[key] = next
  return { count: next, isFallback: true }
}

/**
 * Startup hook. Intentionally seeds NOTHING: no default users, no default
 * credentials. Every tenant bucket is created on demand per session.
 */
export async function initUpstashDefaults(): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  // no-op by design
}
