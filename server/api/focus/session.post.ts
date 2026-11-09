import type webPush from 'web-push'
import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS, redisSet } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import { schedulePushTimer, cancelPushTimer, storePushSubscription } from '~/server/utils/pushScheduler'
import type { FocusSession } from '~/types/focus'

interface FocusSessionRequestBody extends Partial<FocusSession> {
  pushSubscription?: webPush.PushSubscription | null
}

const VALID_MODES = ['work', 'quickWork', 'break', 'recovery']
const MAX_DURATION_SECONDS = 24 * 60 * 60

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.FOCUS_SESSION)
  const body = (await readBody<FocusSessionRequestBody>(event)) || {}

  if (body.mode !== undefined && !VALID_MODES.includes(body.mode)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid focus mode.' })
  }
  if (body.durationSeconds !== undefined && (typeof body.durationSeconds !== 'number' || body.durationSeconds < 0 || body.durationSeconds > MAX_DURATION_SECONDS)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid duration.' })
  }
  if (body.elapsedSeconds !== undefined && (typeof body.elapsedSeconds !== 'number' || body.elapsedSeconds < 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid elapsed time.' })
  }
  if (body.targetEndTimestamp !== undefined && body.targetEndTimestamp !== null && typeof body.targetEndTimestamp !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid target timestamp.' })
  }

  // Audit H3: the session id is scoped to the authenticated user so one tenant
  // can never cancel another tenant's scheduled notification.
  const session: FocusSession = {
    id: `${user.id}:focus-session-main`,
    taskId: typeof body.taskId === 'string' ? body.taskId.slice(0, 200) : undefined,
    taskTitle: typeof body.taskTitle === 'string' ? body.taskTitle.slice(0, 500) : undefined,
    mode: body.mode || 'work',
    durationSeconds: body.durationSeconds || 1500,
    elapsedSeconds: body.elapsedSeconds || 0,
    isRunning: body.isRunning === true,
    targetEndTimestamp: body.targetEndTimestamp ?? null,
    completed: body.completed === true,
    timestamp: new Date().toISOString()
  }

  if (body.pushSubscription && body.pushSubscription.endpoint) {
    await storePushSubscription(user.id, body.pushSubscription)
  }

  await redisSet(key, session)

  if (session.isRunning && session.targetEndTimestamp && session.targetEndTimestamp > Date.now()) {
    const isWork = session.mode === 'work' || session.mode === 'quickWork'
    const notificationTitle = isWork ? 'Focus Session Completed! 🎯' : 'Break Time Ended! ⚡'
    const notificationBody = isWork
      ? `Great job on "${session.taskTitle || 'Focus Task'}"! Time for a recharge break.`
      : 'Ready to dive back into deep work?'
    const targetUrl = isWork ? '/recovery' : '/execute'

    await schedulePushTimer(
      session.id,
      session.targetEndTimestamp,
      { title: notificationTitle, body: notificationBody, icon: '/favicon.svg', url: targetUrl },
      user.id,
      body.pushSubscription || undefined
    )
  } else {
    cancelPushTimer(session.id)
  }

  const clientId = getHeader(event, 'x-client-id') || undefined
  syncBus.emitSync(event, 'focus', 'update', user.id, clientId)

  return { session }
})
