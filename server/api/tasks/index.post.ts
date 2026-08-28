import { REDIS_KEYS, redisGet, redisSet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import type { TaskItem, QuadrantType } from '~/types/task'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.TASKS)
  const body = await readBody<{ title?: string; quadrant?: QuadrantType }>(event)
  
  if (!body || !body.title || !body.title.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task title is required.'
    })
  }

  const { data: currentTasks } = await redisGet<TaskItem[]>(key)
  const taskList = currentTasks || []

  const newTask: TaskItem = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: body.title.trim(),
    quadrant: body.quadrant || 'inbox',
    createdAt: new Date().toISOString(),
    completed: false
  }

  const updatedTasks = [newTask, ...taskList]
  await redisSet(key, updatedTasks)

  // Broadcast sync event to all connected clients
  syncBus.emitSync('tasks', 'create', userIdentifier)

  return {
    task: newTask,
    tasks: updatedTasks
  }
})
