import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS } from '~/server/utils/redis'
import { deleteCollectionItem, hashGet } from '~/server/utils/store'
import { syncBus } from '~/server/utils/bus'
import type { DistractionItem } from '~/types/focus'

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.DISTRACTIONS)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Distraction ID parameter is required.' })
  }

  const existing = await hashGet<DistractionItem>(key, id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Distraction not found.' })
  }

  await deleteCollectionItem(key, id)
  syncBus.emitSync(event, 'distractions', 'delete', user.id)

  return { success: true, id }
})
