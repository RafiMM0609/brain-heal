import { REDIS_KEYS, redisGet, redisSet, getAuthUserIdentifier, getUserRedisKey, DEFAULT_TASKS } from '~/server/utils/redis'
import type { TaskItem } from '~/types/task'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.TASKS)
  const { data: tasks, isFallback } = await redisGet<TaskItem[]>(key)

  // If key has never been written for this user: initialize and persist DEFAULT_TASKS in Upstash
  if (tasks === null || tasks === undefined) {
    await redisSet(key, DEFAULT_TASKS)
    return {
      tasks: DEFAULT_TASKS,
      isFallback
    }
  }

  return {
    tasks: Array.isArray(tasks) ? tasks : [],
    isFallback
  }
})
