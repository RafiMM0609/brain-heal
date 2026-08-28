import { REDIS_KEYS, redisGet, redisSet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import type { ShareItem } from './index.get'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.SHARE)
  const query = getQuery(event)
  const id = query.id as string | undefined
  const clear = query.clear === 'true'

  if (clear) {
    await redisSet(key, [])
    syncBus.emitSync('share', 'delete', userIdentifier)
    return { success: true, cleared: true }
  }

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Item ID or clear query param is required'
    })
  }

  const { data: existingItems } = await redisGet<ShareItem[]>(key)
  const currentItems = Array.isArray(existingItems) ? existingItems : []

  const updatedItems = currentItems.filter((item) => item.id !== id)
  await redisSet(key, updatedItems)

  syncBus.emitSync('share', 'delete', userIdentifier)

  return { success: true, deletedId: id }
})
