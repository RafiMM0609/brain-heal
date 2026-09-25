import { getRedisClient, initUpstashDefaults } from '~/server/utils/redis'

export default defineNitroPlugin(async () => {
  const client = getRedisClient()
  if (client) {
    try {
      const pong = await client.ping()
      console.log(`[Upstash Redis] Connected successfully! Ping: ${pong}`)
      await initUpstashDefaults()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('[Upstash Redis] Failed to connect on startup:', errorMsg)
    }
  } else {
    console.warn('[Upstash Redis] Client not configured. Running with in-memory fallback.')
  }
})
