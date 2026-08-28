import { useAuthStore } from '~/stores/useAuthStore'

export function useApi() {
  function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    if (import.meta.client) {
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
    }
    return headers
  }

  async function apiFetch<T>(request: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    const headers = {
      ...getAuthHeaders(),
      ...((options.headers as Record<string, string>) || {})
    }
    return $fetch<T>(request, {
      ...options,
      headers
    })
  }

  return {
    apiFetch,
    getAuthHeaders
  }
}
