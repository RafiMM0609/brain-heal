import { REDIS_KEYS, redisGet, redisSet } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import type { TaskItem } from '~/types/task'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task ID parameter is required.'
    })
  }

  const { data: currentTasks } = await redisGet<TaskItem[]>(REDIS_KEYS.TASKS)
  const taskList = currentTasks || []

  const updatedTasks = taskList.filter(t => t.id !== id)
  await redisSet(REDIS_KEYS.TASKS, updatedTasks)

  // Broadcast sync event to all connected clients
  syncBus.emitSync('tasks', 'delete')

  return {
    deletedId: id,
    tasks: updatedTasks
  }
})
