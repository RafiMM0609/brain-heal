import { getRedisClient } from '~/server/utils/redis'

export default defineNitroPlugin(async () => {
  const client = getRedisClient()

  if (client) {
    try {
      await client.ping()
      console.log('[Upstash Redis] Connected successfully.')
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('[Upstash Redis] Failed to connect on startup:', errorMsg)
    }
  } else {
    // Audit note: the in-memory fallback is shared process-wide, so all tenants
    // in that process share one store. Acceptable for local dev only.
    console.warn('[Upstash Redis] Client not configured. Using in-memory fallback (development only).')
  }
})
