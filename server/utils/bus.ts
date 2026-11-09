import { EventEmitter } from 'node:events'
import type { H3Event } from 'h3'

export type SyncType = 'tasks' | 'focus' | 'distractions' | 'share'
export type SyncAction = 'create' | 'update' | 'delete'

export interface SyncEventPayload {
  type: SyncType
  action: SyncAction
  /** Opaque server-generated user id. Never an email or other PII. */
  userId: string
  clientId?: string
  timestamp: string
}

/**
 * In-process pub/sub for SSE fan-out.
 *
 * SECURITY (audit H1): events are keyed by the opaque `userId`. The SSE handler
 * filters on this id server-side, so a subscriber only ever receives its own
 * tenant's events. The user identifier is never sent to the browser.
 */
class SyncBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100)
  }

  emitSync(
    _event: H3Event,
    type: SyncType,
    action: SyncAction = 'update',
    userId: string,
    clientId?: string
  ): void {
    if (!userId) return
    const payload: SyncEventPayload = {
      type,
      action,
      userId,
      clientId,
      timestamp: new Date().toISOString()
    }
    this.emit('sync', payload)
  }
}

export const syncBus = new SyncBus()
