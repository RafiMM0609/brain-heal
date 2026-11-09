import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS } from '~/server/utils/redis'
import { listCollection, putCollectionItem, hashLen } from '~/server/utils/store'
import { syncBus } from '~/server/utils/bus'
import type { TaskItem, QuadrantType } from '~/types/task'

const MAX_TITLE_LENGTH = 500
const MAX_TASKS = 500
const VALID_QUADRANTS: QuadrantType[] = ['inbox', 'do-first', 'schedule', 'delegate', 'eliminate']

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.TASKS)
  const body = await readBody<{ title?: string; quadrant?: QuadrantType }>(event)

  if (!body || typeof body.title !== 'string' || !body.title.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Task title is required.' })
  }
  if (body.title.length > MAX_TITLE_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: 'Task title is too long.' })
  }
  if (body.quadrant !== undefined && !VALID_QUADRANTS.includes(body.quadrant)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid quadrant.' })
  }

  // Cheap pre-check; the real guarantee is that the insert below cannot be lost.
  if ((await hashLen(key)) >= MAX_TASKS) {
    throw createError({ statusCode: 400, statusMessage: 'Task limit reached.' })
  }

  const newTask: TaskItem = {
    // Random suffix makes collisions between same-millisecond inserts unlikely.
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    title: body.title.trim(),
    quadrant: body.quadrant || 'inbox',
    createdAt: new Date().toISOString(),
    completed: false
  }

  // Audit M5: a single HSET, so concurrent creates both land.
  await putCollectionItem(key, newTask)

  const clientId = getHeader(event, 'x-client-id') || undefined
  syncBus.emitSync(event, 'tasks', 'create', user.id, clientId)

  const tasks = await listCollection<TaskItem>(key)
  return { task: newTask, tasks }
})
