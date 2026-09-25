import { Redis } from '@upstash/redis'
import type { H3Event } from 'h3'
import { getHeader } from 'h3'
import type { TaskItem } from '~/types/task'
import type { UserAccount } from '~/types/user'

let redisInstance: Redis | null = null
let currentConfiguredUrl: string | null = null

export const REDIS_KEYS = {
  TASKS: 'neuralflow:tasks',
  DISTRACTIONS: 'neuralflow:distractions',
  FOCUS_SESSION: 'neuralflow:focus_session',
  SHARE: 'neuralflow:share_items',
  USERS: 'neuralflow:users'
}

export const DEFAULT_TASKS: TaskItem[] = [
  { id: 'task-1', title: 'Finalize Q3 Strategy Deck', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-2', title: 'Reply to vendor emails', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-3', title: 'Schedule dentist appointment', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-4', title: 'Read industry newsletter', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-5', title: 'Fix urgent server bug', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false }
]

export const DEFAULT_USERS: UserAccount[] = [
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
const inMemoryStore: Record<string, unknown> = {
  [REDIS_KEYS.TASKS]: [...DEFAULT_TASKS],
  [`${REDIS_KEYS.TASKS}:guest-default`]: [...DEFAULT_TASKS],
  [`${REDIS_KEYS.TASKS}:guest-1`]: [...DEFAULT_TASKS],
  [REDIS_KEYS.DISTRACTIONS]: [],
  [REDIS_KEYS.FOCUS_SESSION]: null,
  [REDIS_KEYS.SHARE]: [],
  [REDIS_KEYS.USERS]: [...DEFAULT_USERS]
}

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
    console.warn('[Redis] Upstash Redis credentials not configured. Using in-memory fallback.')
    return null
  }

  // Reuse existing client if url has not changed
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
      // When Redis successfully queries, return the value (or null if not found) with isFallback: false
      return { data: value !== undefined ? value : null, isFallback: false }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[Redis] Error getting key "${key}":`, errorMsg)
    }
  }

  const fallbackData = (inMemoryStore[key] !== undefined ? inMemoryStore[key] : null) as T | null
  return { data: fallbackData, isFallback: true }
}

export async function redisSet<T>(key: string, value: T): Promise<{ success: boolean; isFallback: boolean }> {
  const client = getRedisClient()
  if (client) {
    try {
      await client.set(key, value)
      return { success: true, isFallback: false }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[Redis] Error setting key "${key}":`, errorMsg)
    }
  }

  // Fallback in-memory store only if Redis is unavailable
  inMemoryStore[key] = value
  return { success: true, isFallback: true }
}

export async function initUpstashDefaults(): Promise<{ seededUsers: boolean; seededTasks: boolean }> {
  const client = getRedisClient()
  if (!client) {
    return { seededUsers: false, seededTasks: false }
  }

  let seededUsers = false
  let seededTasks = false

  try {
    // 1. Seed demo user into Upstash if REDIS_KEYS.USERS doesn't exist
    const users = await client.get<UserAccount[]>(REDIS_KEYS.USERS)
    if (!users || !Array.isArray(users) || users.length === 0) {
      await client.set(REDIS_KEYS.USERS, DEFAULT_USERS)
      seededUsers = true
      console.log('[Redis] Seeded DEFAULT_USERS into Upstash Redis.')
    }

    // 2. Seed default tasks for guest-default if it doesn't exist
    const defaultGuestKey = getUserRedisKey('guest-default', REDIS_KEYS.TASKS)
    const guestTasks = await client.get<TaskItem[]>(defaultGuestKey)
    if (!guestTasks || !Array.isArray(guestTasks) || guestTasks.length === 0) {
      await client.set(defaultGuestKey, DEFAULT_TASKS)
      seededTasks = true
      console.log(`[Redis] Seeded DEFAULT_TASKS into Upstash Redis for ${defaultGuestKey}.`)
    }

    // Also seed for guest-1 for immediate smooth guest experience
    const guest1Key = getUserRedisKey('guest-1', REDIS_KEYS.TASKS)
    const guest1Tasks = await client.get<TaskItem[]>(guest1Key)
    if (!guest1Tasks || !Array.isArray(guest1Tasks) || guest1Tasks.length === 0) {
      await client.set(guest1Key, DEFAULT_TASKS)
      console.log(`[Redis] Seeded DEFAULT_TASKS into Upstash Redis for ${guest1Key}.`)
    }
  } catch (err) {
    console.error('[Redis] Error seeding defaults into Upstash Redis:', err)
  }

  return { seededUsers, seededTasks }
}
