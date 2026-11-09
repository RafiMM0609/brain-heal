import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS, redisGet } from '~/server/utils/redis'
import { listCollection } from '~/server/utils/store'
import type { ShareItem } from '~/types/share'

export type { ShareItem }

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.SHARE)

  const items = await listCollection<ShareItem>(key, async () => {
    const { data } = await redisGet<ShareItem[]>(key)
    return data
  })

  return { items }
})
