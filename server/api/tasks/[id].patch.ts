import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS } from '~/server/utils/redis'
import { patchCollectionItem } from '~/server/utils/store'
import { syncBus } from '~/server/utils/bus'
import type { TaskItem, QuadrantType } from '~/types/task'

const MAX_TITLE_LENGTH = 500
const VALID_QUADRANTS: QuadrantType[] = ['inbox', 'do-first', 'schedule', 'delegate', 'eliminate']

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.TASKS)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Task ID parameter is required.' })
  }

  const body = await readBody<{ title?: string; quadrant?: QuadrantType; completed?: boolean }>(event)

  if (body?.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Task title cannot be empty.' })
    }
    if (body.title.length > MAX_TITLE_LENGTH) {
      throw createError({ statusCode: 400, statusMessage: 'Task title is too long.' })
    }
  }
  if (body?.quadrant !== undefined && !VALID_QUADRANTS.includes(body.quadrant)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid quadrant.' })
  }
  if (body?.completed !== undefined && typeof body.completed !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid completed value.' })
  }

  // Audit M5: only this task's hash field is rewritten, so two people editing
  // different tasks simultaneously no longer overwrite each other.
  const updatedTask = await patchCollectionItem<TaskItem>(key, id, (current) => ({
    ...current,
    ...(body?.title !== undefined ? { title: body.title.trim() } : {}),
    ...(body?.quadrant !== undefined ? { quadrant: body.quadrant } : {}),
    ...(body?.completed !== undefined ? { completed: body.completed } : {})
  }))

  if (!updatedTask) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found.' })
  }

  syncBus.emitSync(event, 'tasks', 'update', user.id)

  return { task: updatedTask }
})
