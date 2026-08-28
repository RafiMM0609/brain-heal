import { syncBus, type SyncEventPayload } from '~/server/utils/bus'

export default defineEventHandler((event) => {
  setHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  })

  const res = event.node.res

  // Initial connection confirmation event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)

  const handleSync = (payload: SyncEventPayload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  syncBus.on('sync', handleSync)

  // Periodic heartbeat comment every 15s to keep connection alive across proxies/mobile browsers
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
