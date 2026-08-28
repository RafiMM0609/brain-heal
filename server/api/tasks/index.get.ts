import { REDIS_KEYS, redisGet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import type { TaskItem } from '~/types/task'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.TASKS)
  const { data: tasks, isFallback } = await redisGet<TaskItem[]>(key)
  return {
    tasks: tasks || [],
    isFallback
  }
})
