import { EventEmitter } from 'node:events'

export interface SyncEventPayload {
  type: 'tasks' | 'focus' | 'distractions' | 'share'
  action?: 'create' | 'update' | 'delete'
  userIdentifier?: string
  clientId?: string
  timestamp: string
}

class SyncBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100)
  }

  emitSync(
    type: 'tasks' | 'focus' | 'distractions' | 'share',
    action: 'create' | 'update' | 'delete' = 'update',
    userIdentifier?: string,
    clientId?: string
  ) {
    const payload: SyncEventPayload = {
      type,
      action,
      userIdentifier,
      clientId,
      timestamp: new Date().toISOString()
    }
    this.emit('sync', payload)
  }
}

export const syncBus = new SyncBus()
