import { REDIS_KEYS, redisSet, getAuthUserIdentifier, getUserRedisKey } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import { schedulePushTimer, cancelPushTimer, storePushSubscription } from '~/server/utils/pushScheduler'
import type { FocusSession } from '~/types/focus'

export default defineEventHandler(async (event) => {
  const userIdentifier = getAuthUserIdentifier(event)
  const key = getUserRedisKey(userIdentifier, REDIS_KEYS.FOCUS_SESSION)
  const body = await readBody<Partial<FocusSession> & { pushSubscription?: any }>(event)

  const session: FocusSession = {
    id: body.id || 'focus-session-main',
    taskId: body.taskId,
    taskTitle: body.taskTitle,
    mode: body.mode || 'work',
    durationSeconds: body.durationSeconds || 1500,
    elapsedSeconds: body.elapsedSeconds || 0,
    isRunning: body.isRunning !== undefined ? body.isRunning : false,
    targetEndTimestamp: body.targetEndTimestamp !== undefined ? body.targetEndTimestamp : null,
    completed: body.completed || false,
    timestamp: new Date().toISOString()
  }

  // Store push subscription if provided
  if (body.pushSubscription && body.pushSubscription.endpoint) {
    await storePushSubscription(body.pushSubscription)
  }

  // Save session to Upstash Redis / store
  await redisSet(key, session)

  // Handle Nitro Web Push Notification timer edge cases
  if (session.isRunning && session.targetEndTimestamp && session.targetEndTimestamp > Date.now()) {
    const isWork = session.mode === 'work'
    const notificationTitle = isWork ? 'Focus Session Completed! 🎯' : 'Break Time Ended! ⚡'
    const notificationBody = isWork
      ? `Great job on "${session.taskTitle || 'Focus Task'}"! Time for a recharge break.`
      : 'Ready to dive back into deep work?'
    const targetUrl = isWork ? '/recovery' : '/execute'

    await schedulePushTimer(
      session.id,
      session.targetEndTimestamp,
      {
        title: notificationTitle,
        body: notificationBody,
        icon: '/favicon.svg',
        url: targetUrl
      },
      body.pushSubscription
    )
  } else {
    // If timer is paused, stopped, skipped, or completed -> Cancel push notification timer immediately!
    cancelPushTimer(session.id)
  }

  // Broadcast sync event to all connected clients
  syncBus.emitSync('focus', 'update', userIdentifier)

  return {
    session
  }
})
