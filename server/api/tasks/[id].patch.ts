import { REDIS_KEYS, redisGet, redisSet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import type { TaskItem, QuadrantType } from '~/types/task'

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

  const body = await readBody<{ title?: string; quadrant?: QuadrantType; completed?: boolean }>(event)
  const { data: currentTasks } = await redisGet<TaskItem[]>(key)
  const taskList = currentTasks || []

  const index = taskList.findIndex(t => t.id === id)
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: `Task with ID ${id} not found.`
    })
  }

  const existingTask = taskList[index]
  const updatedTask: TaskItem = {
    ...existingTask,
    ...(body.title !== undefined ? { title: body.title.trim() } : {}),
    ...(body.quadrant !== undefined ? { quadrant: body.quadrant } : {}),
    ...(body.completed !== undefined ? { completed: body.completed } : {})
  }

  taskList[index] = updatedTask
  await redisSet(key, taskList)

  // Broadcast sync event to all connected clients
  syncBus.emitSync('tasks', 'update', userIdentifier)

  return {
    task: updatedTask,
    tasks: taskList
  }
})
