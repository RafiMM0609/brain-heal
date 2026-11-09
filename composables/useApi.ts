export function getClientId(): string {
  if (!import.meta.client || typeof window === 'undefined') return 'server'
  if (!window.__NUXT_CLIENT_ID__) {
    window.__NUXT_CLIENT_ID__ = 'client-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  }
  return window.__NUXT_CLIENT_ID__
}

/**
 * Audit C1: this composable used to attach `x-user-email` / `x-user-id` headers
 * to every request, which was the entire authentication mechanism (and the
 * tenant isolation bypass). Identity now travels exclusively in the httpOnly
 * session cookie, which the browser attaches automatically -- so there is
 * nothing to build here beyond the non-security `x-client-id` used to suppress
 * SSE self-echo.
 */
export function useApi() {
  function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    if (import.meta.client) {
      headers['x-client-id'] = getClientId()
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
