import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS, redisGet, DEFAULT_TASKS } from '~/server/utils/redis'
import { listCollection, putCollectionItem, hashLen } from '~/server/utils/store'
import type { TaskItem } from '~/types/task'

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.TASKS)

  let tasks = await listCollection<TaskItem>(key, async () => {
    const { data } = await redisGet<TaskItem[]>(key)
    return data
  })

  // First visit for this tenant: seed the demo list. Uses per-item atomic
  // writes so a concurrent request cannot clobber a partially written list.
  if (tasks.length === 0 && (await hashLen(key)) === 0) {
    await Promise.all(DEFAULT_TASKS.map((task) => putCollectionItem(key, task)))
    tasks = DEFAULT_TASKS
  }

  return { tasks }
})
