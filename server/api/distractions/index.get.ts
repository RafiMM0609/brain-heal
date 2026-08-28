import { REDIS_KEYS, redisGet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import type { DistractionItem } from '~/types/focus'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.DISTRACTIONS)
  const { data: distractions, isFallback } = await redisGet<DistractionItem[]>(key)
  return {
    distractions: distractions || [],
    isFallback
  }
})
