import type { H3Event } from 'h3'
import { getRequestIP } from 'h3'
import { redisIncrWindow, REDIS_KEYS } from './redis'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Fixed-window rate limiter keyed by a caller-supplied scope plus the client IP.
 * Used to blunt online password guessing (audit finding H4) and to cap
 * unauthenticated upload/registration abuse.
 */
export async function rateLimit(
  event: H3Event,
  scope: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const safeScope = scope.replace(/[^a-zA-Z0-9:_-]/g, '')
  const safeIp = String(ip).replace(/[^a-zA-Z0-9:._-]/g, '_')
  const key = `${REDIS_KEYS.RATE_LIMIT}:${safeScope}:${safeIp}`

  const { count } = await redisIncrWindow(key, windowSeconds)

  if (count > limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: windowSeconds }
  }
  return { allowed: true, remaining: Math.max(0, limit - count), retryAfterSeconds: 0 }
}

/**
 * Enforce a rate limit, throwing 429 with Retry-After when exceeded.
 */
export async function enforceRateLimit(
  event: H3Event,
  scope: string,
  limit: number,
  windowSeconds: number
): Promise<void> {
  const result = await rateLimit(event, scope, limit, windowSeconds)
  if (!result.allowed) {
    setHeader(event, 'Retry-After', result.retryAfterSeconds)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.'
    })
  }
}
