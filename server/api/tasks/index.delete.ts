import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS, DEFAULT_TASKS } from '~/server/utils/redis'
import { hashClear, listCollection, putCollectionItem } from '~/server/utils/store'
import { syncBus } from '~/server/utils/bus'
import type { TaskItem } from '~/types/task'

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.TASKS)
  const query = getQuery(event)
  const reset = query.reset === 'true'

  /**
   * Audit F-01: this used `redisDel()`, which only cleared the legacy
   * `inMemoryStore` mirror — but collections live in `memoryHashes`, so the
   * delete silently did nothing in the fallback path and the endpoint returned
   * the unchanged list. `hashClear()` removes the hash itself (DEL) and keeps
   * the Upstash and in-memory paths in sync.
   */
  const cleared = await hashClear(key)

  if (reset) {
    await Promise.all(DEFAULT_TASKS.map((task) => putCollectionItem(key, task)))
  }

  const remaining = await listCollection<TaskItem>(key)

  // Report failure honestly instead of claiming success over stale data.
  if (!cleared && remaining.length > 0) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to clear tasks.' })
  }

  syncBus.emitSync(event, 'tasks', 'delete', user.id)

  return { success: true, tasks: remaining }
})
