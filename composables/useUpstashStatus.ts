import { ref, onMounted } from 'vue'

export function useUpstashStatus() {
  const isConnected = ref(true)
  const latency = ref<number | null>(null)
  const endpointHost = ref<string>('Upstash Cloud')
  const isChecking = ref(false)

  async function checkHealth() {
    if (!import.meta.client) return
    try {
      isChecking.value = true
      const data = await $fetch<{
        redisConnected: boolean
        latencyMs?: number
        endpointHost?: string
      }>('/api/health')
      isConnected.value = !!data.redisConnected
      if (data.latencyMs !== undefined) latency.value = data.latencyMs
      if (data.endpointHost) endpointHost.value = data.endpointHost
    } catch {
      isConnected.value = false
    } finally {
      isChecking.value = false
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      checkHealth()
    })
  }

  return {
    isConnected,
    latency,
    endpointHost,
    isChecking,
    checkHealth
  }
}
