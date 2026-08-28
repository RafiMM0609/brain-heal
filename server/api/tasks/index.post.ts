import { REDIS_KEYS, redisGet, redisSet } from '~/server/utils/redis'
import type { TaskItem, QuadrantType } from '~/types/task'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ title?: string; quadrant?: QuadrantType }>(event)
  
  if (!body || !body.title || !body.title.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task title is required.'
    })
  }

  const { data: currentTasks } = await redisGet<TaskItem[]>(REDIS_KEYS.TASKS)
  const taskList = currentTasks || []

  const newTask: TaskItem = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: body.title.trim(),
    quadrant: body.quadrant || 'inbox',
    createdAt: new Date().toISOString(),
    completed: false
  }

  const updatedTasks = [newTask, ...taskList]
  await redisSet(REDIS_KEYS.TASKS, updatedTasks)

  return {
    task: newTask,
    tasks: updatedTasks
  }
})
