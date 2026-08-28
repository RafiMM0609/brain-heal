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

    return {
      status: 'ok',
      message: 'Successfully connected to Upstash Redis.',
      redisConnected: true,
      pingResponse: pong,
      latencyMs,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Failed to ping Upstash Redis.',
      redisConnected: false,
      timestamp: new Date().toISOString()
    }
  }
})
