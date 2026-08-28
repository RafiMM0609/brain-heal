import { storePushSubscription } from '~/server/utils/pushScheduler'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body || !body.endpoint) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid push subscription payload'
    })
  }

  await storePushSubscription(body)

  return {
    success: true,
    message: 'Push subscription stored successfully'
  }
})
