import { useTaskStore } from '~/stores/useTaskStore'
import { useFocusStore } from '~/stores/useFocusStore'
import { useDistractionStore } from '~/stores/useDistractionStore'

export function useRealtimeSync() {
  const isConnected = ref(false)
  const lastSyncTime = ref<string | null>(null)
  let eventSource: EventSource | null = null
  let reconnectTimeout: any = null

  function syncAllStores() {
    const taskStore = useTaskStore()
    const focusStore = useFocusStore()
    const distractionStore = useDistractionStore()

    taskStore.fetchTasks()
    focusStore.fetchSession()
    distractionStore.fetchDistractions()
    lastSyncTime.value = new Date().toLocaleTimeString()
  }

  function connect() {
    if (!import.meta.client || eventSource) return

    try {
      eventSource = new EventSource('/api/sync/stream')

      eventSource.onopen = () => {
        isConnected.value = true
        console.log('[RealtimeSync] Connected to SSE stream.')
      }

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)

          if (payload.type === 'connected') {
            isConnected.value = true
            return
          }

          const taskStore = useTaskStore()
          const focusStore = useFocusStore()
          const distractionStore = useDistractionStore()

          if (payload.type === 'tasks') {
            taskStore.fetchTasks()
          } else if (payload.type === 'focus') {
            focusStore.fetchSession()
          } else if (payload.type === 'distractions') {
            distractionStore.fetchDistractions()
          }

          lastSyncTime.value = new Date().toLocaleTimeString()
        } catch (err) {
          // Ignore heartbeats or non-JSON comments
        }
      }

      eventSource.onerror = () => {
        isConnected.value = false
        if (eventSource) {
          eventSource.close()
          eventSource = null
        }
        // Auto-reconnect after 3 seconds
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null
            connect()
          }, 3000)
        }
      }
    } catch (err) {
      console.error('[RealtimeSync] Failed to establish EventSource connection:', err)
    }
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    isConnected.value = false
  }

  if (import.meta.client) {
    onMounted(() => {
      connect()

      // Tab focus / screen wake-up sync
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          syncAllStores()
          if (!isConnected.value) {
            connect()
          }
        }
      }

      window.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', syncAllStores)

      onUnmounted(() => {
        window.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', syncAllStores)
        disconnect()
      })
    })
  }

  return {
    isConnected,
    lastSyncTime,
    syncAllStores,
    connect,
    disconnect
  }
}
