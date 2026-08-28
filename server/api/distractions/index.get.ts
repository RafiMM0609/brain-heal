import { REDIS_KEYS, redisGet } from '~/server/utils/redis'
import type { DistractionItem } from '~/types/focus'

export default defineEventHandler(async () => {
  const { data: distractions, isFallback } = await redisGet<DistractionItem[]>(REDIS_KEYS.DISTRACTIONS)
  return {
    distractions: distractions || [],
    isFallback
  }
})
