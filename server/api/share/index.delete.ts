import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS, redisDel } from '~/server/utils/redis'
import { deleteCollectionItem, hashGet } from '~/server/utils/store'
import { syncBus } from '~/server/utils/bus'
import type { ShareItem } from './index.get'

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.SHARE)
  const query = getQuery(event)
  const id = typeof query.id === 'string' ? query.id : undefined
  const clear = query.clear === 'true'

  if (clear) {
    await redisDel(key)
    syncBus.emitSync(event, 'share', 'delete', user.id)
    return { success: true, cleared: true }
  }

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Item ID or clear query param is required'
    })
  }

  const existing = await hashGet<ShareItem>(key, id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Share item not found.' })
  }

  await deleteCollectionItem(key, id)
  syncBus.emitSync(event, 'share', 'delete', user.id)

  return { success: true, deletedId: id }
})
