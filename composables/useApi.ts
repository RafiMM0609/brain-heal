import { useAuthStore } from '~/stores/useAuthStore'

export function getClientId(): string {
  if (!import.meta.client || typeof window === 'undefined') return 'server'
  if (!(window as any).__NUXT_CLIENT_ID__) {
    ;(window as any).__NUXT_CLIENT_ID__ = 'client-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  }
  return (window as any).__NUXT_CLIENT_ID__
}

export function useApi() {
  function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    if (import.meta.client) {
      headers['x-client-id'] = getClientId()
    }
    try {
      const authStore = useAuthStore()
      if (authStore.user) {
        if (authStore.user.email) {
          headers['x-user-email'] = authStore.user.email
        }
        if (authStore.user.id) {
          headers['x-user-id'] = authStore.user.id
        }
      }
    } catch (err) {
      // Pinia store might not be ready yet
    }
    return headers
  }

  async function apiFetch<T>(request: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    const headers = {
      ...getAuthHeaders(),
      ...((options.headers as Record<string, string>) || {})
    }
    return $fetch(request, {
      ...options,
      headers
    }) as Promise<T>
  }

  return {
    apiFetch,
    getAuthHeaders,
    getClientId
  }
}

