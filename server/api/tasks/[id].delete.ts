import { REDIS_KEYS, redisGet, redisSet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import type { TaskItem } from '~/types/task'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.TASKS)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task ID parameter is required.'
    })
  }

  const { data: currentTasks } = await redisGet<TaskItem[]>(key)
  const taskList = currentTasks || []

  const updatedTasks = taskList.filter(t => t.id !== id)
  await redisSet(key, updatedTasks)

  // Broadcast sync event to all connected clients
  syncBus.emitSync('tasks', 'delete', userIdentifier)

  return {
    deletedId: id,
    tasks: updatedTasks
  }
})
