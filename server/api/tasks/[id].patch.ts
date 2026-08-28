import { REDIS_KEYS, redisGet, redisSet } from '~/server/utils/redis'
import type { TaskItem, QuadrantType } from '~/types/task'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task ID parameter is required.'
    })
  }

  const body = await readBody<{ title?: string; quadrant?: QuadrantType; completed?: boolean }>(event)
  const { data: currentTasks } = await redisGet<TaskItem[]>(REDIS_KEYS.TASKS)
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
  await redisSet(REDIS_KEYS.TASKS, taskList)

  return {
    task: updatedTask,
    tasks: taskList
  }
})
