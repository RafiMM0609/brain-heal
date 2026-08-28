import { REDIS_KEYS, redisGet, redisSet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import type { DistractionItem } from '~/types/focus'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.DISTRACTIONS)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Distraction ID parameter is required.'
    })
  }

  const { data: currentDistractions } = await redisGet<DistractionItem[]>(key)
  const distractionList = currentDistractions || []
  const updatedList = distractionList.filter(d => d.id !== id)

  await redisSet(key, updatedList)
  syncBus.emitSync('distractions', 'delete', userIdentifier)

  return {
    success: true,
    id,
    distractions: updatedList
  }
})
