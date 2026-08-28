import { REDIS_KEYS, redisSet } from '~/server/utils/redis'
import type { FocusSession } from '~/types/focus'

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<FocusSession>>(event)

  const session: FocusSession = {
    id: body.id || `session-${Date.now()}`,
    taskId: body.taskId,
    taskTitle: body.taskTitle,
    mode: body.mode || 'work',
    durationSeconds: body.durationSeconds || 1500,
    elapsedSeconds: body.elapsedSeconds || 0,
    completed: body.completed || false,
    timestamp: new Date().toISOString()
  }

  await redisSet(REDIS_KEYS.FOCUS_SESSION, session)

  return {
    session
  }
})
