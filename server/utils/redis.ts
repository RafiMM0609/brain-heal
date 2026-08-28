import { Redis } from '@upstash/redis'
import type { H3Event } from 'h3'
import { getHeader } from 'h3'

let redisInstance: Redis | null = null

export const REDIS_KEYS = {
  TASKS: 'neuralflow:tasks',
  DISTRACTIONS: 'neuralflow:distractions',
  FOCUS_SESSION: 'neuralflow:focus_session',
  SHARE: 'neuralflow:share_items',
  USERS: 'neuralflow:users'
}

export function getUserRedisKey(userIdentifier: string | undefined | null, baseKey: string): string {
  if (!userIdentifier || typeof userIdentifier !== 'string' || !userIdentifier.trim()) {
    return `${baseKey}:guest-default`
  }
  const clean = userIdentifier.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_')
  return `${baseKey}:${clean}`
}

export function getAuthUserIdentifier(event: H3Event): string {
  const email = getHeader(event, 'x-user-email')
  const userId = getHeader(event, 'x-user-id')
  return email || userId || 'guest-default'
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
  [REDIS_KEYS.FOCUS_SESSION]: null,
  [REDIS_KEYS.SHARE]: [],
  [REDIS_KEYS.USERS]: [
    {
      id: 'user-demo-1',
      name: 'Dr. Alex Rivera',
      email: 'doctor@cognitivelab.ai',
      password: 'password123',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaqN2vR_ltj1O12xsA93TrTwUQjwZSEr1BgDryDkchdLcebgdhls7ka0H717ld8PB6r53uifdMWTC46nHJfyCL3m1y5LaEHA_I0BUa32zUsrKXYTcij-QD24oeiKxhaJxIeLGFILUqSx3Bp9mJcQ7anwB5OPUW88219LfaGvcrQyjbx7h3WN9ViglZcR4KBeQpq2lk8J-6r3YETsnBXKOEYZ8n2zPZJWqjYJvyyHzvgNvPhC-hQ2Pm',
      state: 'Relaxed Alertness',
      createdAt: new Date().toISOString()
    }
  ]
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
