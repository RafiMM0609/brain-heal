import { REDIS_KEYS, redisGet } from '~/server/utils/redis'

export interface ShareItem {
  id: string
  type: 'text' | 'image'
  content: string
  fileName?: string
  fileSizeFormatted?: string
  createdAt: string
}

export default defineEventHandler(async () => {
  const { data, isFallback } = await redisGet<ShareItem[]>(REDIS_KEYS.SHARE)
  return {
    items: Array.isArray(data) ? data : [],
    isFallback
  }
})
