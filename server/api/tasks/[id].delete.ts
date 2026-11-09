import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS } from '~/server/utils/redis'
import { deleteCollectionItem, hashGet } from '~/server/utils/store'
import { syncBus } from '~/server/utils/bus'
import type { TaskItem } from '~/types/task'

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.TASKS)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Task ID parameter is required.' })
  }

  const existing = await hashGet<TaskItem>(key, id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found.' })
  }

  // Audit M5: a single HDEL -- no whole-list rewrite, so concurrent deletes of
  // different tasks both take effect.
  await deleteCollectionItem(key, id)

  syncBus.emitSync(event, 'tasks', 'delete', user.id)

  return { deletedId: id, success: true }
})
