import { REDIS_KEYS, redisGet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'

export interface ShareItem {
  id: string
  type: 'text' | 'image'
  content: string
  fileName?: string
  fileSizeFormatted?: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.SHARE)
  const { data, isFallback } = await redisGet<ShareItem[]>(key)
  return {
    items: Array.isArray(data) ? data : [],
    isFallback
  }
})
