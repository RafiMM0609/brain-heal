import { REDIS_KEYS, redisGet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import type { ShareItem } from '~/types/share'

export type { ShareItem }

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.SHARE)
  const { data, isFallback } = await redisGet<ShareItem[]>(key)
  return {
    items: Array.isArray(data) ? data : [],
    isFallback
  }
})
