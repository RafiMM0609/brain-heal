import { REDIS_KEYS, redisGet } from '~/server/utils/redis'
import type { FocusSession } from '~/types/focus'

export default defineEventHandler(async () => {
  const { data: session, isFallback } = await redisGet<FocusSession | null>(REDIS_KEYS.FOCUS_SESSION)
  return {
    session: session || null,
    isFallback
  }
})
