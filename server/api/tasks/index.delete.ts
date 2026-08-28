import { REDIS_KEYS, redisSet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import type { TaskItem } from '~/types/task'

const DEFAULT_TASKS: TaskItem[] = [
  { id: 'task-1', title: 'Finalize Q3 Strategy Deck', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-2', title: 'Reply to vendor emails', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-3', title: 'Schedule dentist appointment', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-4', title: 'Read industry newsletter', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
  { id: 'task-5', title: 'Fix urgent server bug', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false }
]

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.TASKS)
  const query = getQuery(event)
  const reset = query.reset === 'true'

  const newTasks = reset ? DEFAULT_TASKS : []
  await redisSet(key, newTasks)
  syncBus.emitSync('tasks', 'delete', userIdentifier)

  return {
    success: true,
    tasks: newTasks
  }
})
