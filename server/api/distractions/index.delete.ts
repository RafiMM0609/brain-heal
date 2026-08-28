import { REDIS_KEYS, redisSet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.DISTRACTIONS)

  await redisSet(key, [])
  syncBus.emitSync('distractions', 'delete', userIdentifier)

  return {
    success: true,
    distractions: []
  }
})
