import { syncBus, type SyncEventPayload } from '~/server/utils/bus'
import { resolveSession } from '~/server/utils/auth'

/**
 * Server-sent events for cross-tab / cross-device sync.
 *
 * SECURITY (audit H1): the stream requires a valid session and filters events
 * server-side by the session's opaque user id. It previously broadcast every
 * tenant's identifier and activity to any anonymous listener; the only "filter"
 * was in client-side JS, which `curl` trivially bypasses.
 */
export default defineEventHandler(async (event) => {
  const resolved = await resolveSession(event)
  if (!resolved) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required.' })
  }
  const userId = resolved.user.id

  setHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  })

  const res = event.node.res

  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)

  const handleSync = (payload: SyncEventPayload) => {
    // Tenant isolation: drop anything that is not ours.
    if (payload.userId !== userId) return

    // Do not leak the internal user id to the browser; it only needs the type.
    const outbound = {
      type: payload.type,
      action: payload.action,
      clientId: payload.clientId,
      timestamp: payload.timestamp
    }
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(outbound)}\n\n`)
    }
  }

  syncBus.on('sync', handleSync)

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(`: heartbeat\n\n`)
    }
  }, 15000)

  event.node.req.on('close', () => {
    clearInterval(heartbeat)
    syncBus.off('sync', handleSync)
  })

  return new Promise(() => {})
})
