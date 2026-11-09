import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS, redisGet } from '~/server/utils/redis'
import type { FocusSession } from '~/types/focus'

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.FOCUS_SESSION)
  const { data: session, isFallback } = await redisGet<FocusSession | null>(key)
  return {
    session: session || null,
    isFallback
  }
})
