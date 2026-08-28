import { Redis } from '@upstash/redis'

let redisInstance: Redis | null = null

export const REDIS_KEYS = {
  TASKS: 'neuralflow:tasks',
  DISTRACTIONS: 'neuralflow:distractions',
  FOCUS_SESSION: 'neuralflow:focus_session'
}

// In-memory fallback if Redis credentials are absent or fail
const inMemoryStore: Record<string, any> = {
  [REDIS_KEYS.TASKS]: [
    { id: 'task-1', title: 'Finalize Q3 Strategy Deck', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
    { id: 'task-2', title: 'Reply to vendor emails', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
    { id: 'task-3', title: 'Schedule dentist appointment', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
    { id: 'task-4', title: 'Read industry newsletter', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
    { id: 'task-5', title: 'Fix urgent server bug', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false }
  ],
  [REDIS_KEYS.DISTRACTIONS]: [],
  [REDIS_KEYS.FOCUS_SESSION]: null
}

export function getRedisClient(): Redis | null {
  if (redisInstance) return redisInstance

  const config = useRuntimeConfig()
  const url = config.upstashRedisRestUrl || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = config.upstashRedisRestToken || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('[Redis] Upstash Redis credentials not configured. Using in-memory fallback.')
    return null
  }

  try {
    redisInstance = new Redis({ url, token })
    return redisInstance
  } catch (err) {
    console.error('[Redis] Error creating Upstash Redis client:', err)
    return null
  }
}

export async function redisGet<T>(key: string): Promise<{ data: T; isFallback: boolean }> {
  const client = getRedisClient()
  if (client) {
    try {
      const value = await client.get<T>(key)
      if (value !== null && value !== undefined) {
        return { data: value, isFallback: false }
      }
    } catch (err) {
      console.error(`[Redis] Error getting key "${key}":`, err)
    }
  }
  return { data: (inMemoryStore[key] as T) ?? ([] as unknown as T), isFallback: true }
}

export async function redisSet<T>(key: string, value: T): Promise<{ success: boolean; isFallback: boolean }> {
  inMemoryStore[key] = value
  const client = getRedisClient()
  if (client) {
    try {
      await client.set(key, value)
      return { success: true, isFallback: false }
    } catch (err) {
      console.error(`[Redis] Error setting key "${key}":`, err)
    }
  }
  return { success: true, isFallback: true }
}
