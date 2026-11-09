import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/user'

interface MeResponse {
  user: UserProfile
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const isResolved = ref(false)

  const isAuthenticated = computed(() => !!user.value && !user.value.isGuest)

  /**
   * Audit M1: authentication state is no longer read from localStorage or an
   * editable cookie. The server is the single source of truth: we ask
   * /api/auth/me, which reads only the httpOnly session cookie.
   *
   * Two correctness details:
   *  - Concurrency: the auth plugin (and any future caller) can invoke this
   *    concurrently. Returning early while a request was in flight left the
   *    second caller with `user === null`. Callers now share one in-flight
   *    promise.
   *  - SSR: during server rendering the browser cookie is not attached to the
   *    internal `$fetch`, so `/api/auth/me` would answer 401. The incoming
   *    request headers are forwarded explicitly. (No route middleware guards
   *    the app today, but a component that awaits this during SSR — or a guard
   *    reintroduced later — still needs this to be correct.)
   */
  let inflight: Promise<void> | null = null

  async function loadUserFromStorage() {
    if (inflight) return inflight

    inflight = (async () => {
      isLoading.value = true
      try {
        const res = await $fetch<MeResponse>('/api/auth/me', {
          headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined
        })
        user.value = res.user
      } catch {
        user.value = null
      } finally {
        isLoading.value = false
        isResolved.value = true
        inflight = null
      }
    })()

    return inflight
  }

  function refreshUserData() {
    if (!import.meta.client) return
    nextTick(() => {
      try {
        useTaskStore().fetchTasks()
        useFocusStore().fetchSession()
        useDistractionStore().fetchDistractions()
        useShareStore().fetchItems()
      } catch (err) {
        console.error('[AuthStore] Error refreshing user data:', err)
      }
    })
  }

  /** Starts an isolated guest session: the server mints a random tenant id. */
  async function loginAsGuest() {
    const res = await $fetch<MeResponse>('/api/auth/guest', { method: 'POST' })
    user.value = res.user
    isResolved.value = true
    refreshUserData()
    return res
  }

  async function registerUser(name: string, email: string, password: string) {
    // The response sets the httpOnly session cookie; the body carries the
    // profile, which is display data only and never an authorization input.
    const res = await $fetch<{ success: boolean; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: { name, email, password }
    })
    if (res?.user) {
      user.value = res.user
      isResolved.value = true
      refreshUserData()
    }
    return res
  }

  async function loginUser(email: string, password: string) {
    const res = await $fetch<{ success: boolean; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    if (res?.user) {
      user.value = res.user
      isResolved.value = true
      refreshUserData()
    }
    return res
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Clearing local state is the important part; the cookie is httpOnly.
    }
    user.value = null
  }

  return {
    user,
    isLoading,
    isResolved,
    isAuthenticated,
    loadUserFromStorage,
    loginAsGuest,
    registerUser,
    loginUser,
    logout
  }
})
