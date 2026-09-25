import { REDIS_KEYS, redisSet, getAuthUserIdentifier, getUserRedisKey, DEFAULT_TASKS } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.TASKS)
  const query = getQuery(event)
  const reset = query.reset === 'true'

  const newTasks = reset ? DEFAULT_TASKS : []
  await redisSet(key, newTasks)
  syncBus.emitSync('tasks', 'delete', userIdentifier)

  return {
    success: true,
    tasks: newTasks
  }
})
