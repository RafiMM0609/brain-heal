import { REDIS_KEYS, redisGet } from '~/server/utils/redis'
import type { TaskItem } from '~/types/task'

export default defineEventHandler(async () => {
  const { data: tasks, isFallback } = await redisGet<TaskItem[]>(REDIS_KEYS.TASKS)
  return {
    tasks: tasks || [],
    isFallback
  }
})
