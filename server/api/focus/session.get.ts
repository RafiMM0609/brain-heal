import { REDIS_KEYS, redisGet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import type { FocusSession } from '~/types/focus'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.FOCUS_SESSION)
  const { data: session, isFallback } = await redisGet<FocusSession | null>(key)
  return {
    session: session || null,
    isFallback
  }
})
