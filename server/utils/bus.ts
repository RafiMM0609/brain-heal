import { EventEmitter } from 'node:events'

export interface SyncEventPayload {
  type: 'tasks' | 'focus' | 'distractions'
  action?: 'create' | 'update' | 'delete'
  timestamp: string
}

class SyncBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(100)
  }

  emitSync(type: 'tasks' | 'focus' | 'distractions', action: 'create' | 'update' | 'delete' = 'update') {
    const payload: SyncEventPayload = {
      type,
      action,
      timestamp: new Date().toISOString()
    }
    this.emit('sync', payload)
  }
}

export const syncBus = new SyncBus()
