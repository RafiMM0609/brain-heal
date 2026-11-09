import { getRedisClient } from '~/server/utils/redis'

/**
 * Public liveness probe.
 *
 * Audit C4: this endpoint previously returned the full Upstash hostname, ping
 * payload and -- critically -- `client.keys('neuralflow:*')`, i.e. every tenant
 * key name. Since tenant keys embed user identity, that was a turnkey account
 * enumeration primitive. It now exposes nothing beyond up/down state.
 */
export default defineEventHandler(async () => {
  const client = getRedisClient()

  if (!client) {
    return {
      status: 'degraded',
      redisConnected: false,
      timestamp: new Date().toISOString()
    }
  }

  try {
    await client.ping()
    return {
      status: 'ok',
      redisConnected: true,
      timestamp: new Date().toISOString()
    }
  } catch {
    // Never echo driver error text: it can disclose the endpoint host.
    return {
      status: 'error',
      redisConnected: false,
      timestamp: new Date().toISOString()
    }
  }
})
