import { getRedisClient } from '~/server/utils/redis'

export default defineEventHandler(async () => {
  const startTime = Date.now()
  const client = getRedisClient()

  if (!client) {
    return {
      status: 'degraded',
      message: 'Upstash Redis client not configured or missing credentials.',
      redisConnected: false,
      timestamp: new Date().toISOString()
    }
  }

  try {
    const pong = await client.ping()
    const latencyMs = Date.now() - startTime

    // Fetch existing keys matching neuralflow namespace to verify storage
    const keys = await client.keys('neuralflow:*')

    const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
    let host = 'Upstash Cloud'
    try {
      if (rawUrl) {
        host = new URL(rawUrl).host
      }
    } catch {
      // ignore URL parsing error
    }

    return {
      status: 'ok',
      message: 'Successfully connected to Upstash Redis.',
      redisConnected: true,
      pingResponse: pong,
      endpointHost: host,
      keyCount: keys.length,
      keys,
      latencyMs,
      timestamp: new Date().toISOString()
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to ping Upstash Redis.'
    return {
      status: 'error',
      message,
      redisConnected: false,
      timestamp: new Date().toISOString()
    }
  }
})
