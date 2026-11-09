import { requireSession } from '~/server/utils/auth'
import { storePushSubscription, isAllowedPushEndpoint } from '~/server/utils/pushScheduler'
import { enforceRateLimit } from '~/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  // Audit H2: subscription requires authentication and is bound to the caller.
  const { user } = await requireSession(event)
  await enforceRateLimit(event, 'push:subscribe', 20, 60)

  const body = await readBody<{ endpoint?: string; keys?: { p256dh?: string; auth?: string } }>(event)

  if (!body || !body.endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid push subscription payload' })
  }
  if (!isAllowedPushEndpoint(body.endpoint)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported push endpoint.' })
  }
  if (!body.keys || typeof body.keys.p256dh !== 'string' || typeof body.keys.auth !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid push subscription keys.' })
  }

  await storePushSubscription(user.id, {
    endpoint: body.endpoint,
    keys: { p256dh: body.keys.p256dh, auth: body.keys.auth }
  })

  return { success: true }
})
