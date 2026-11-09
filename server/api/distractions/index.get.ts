import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS, redisGet } from '~/server/utils/redis'
import { listCollection } from '~/server/utils/store'
import type { DistractionItem } from '~/types/focus'

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.DISTRACTIONS)

  const distractions = await listCollection<DistractionItem>(key, async () => {
    const { data } = await redisGet<DistractionItem[]>(key)
    return data
  })

  return { distractions }
})
