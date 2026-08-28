import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/user'

const STORAGE_KEY = 'neuralflow_user'

const defaultGuest: UserProfile = {
  id: 'guest-1',
  name: 'Cognitive Lab Guest',
  isGuest: true,
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaqN2vR_ltj1O12xsA93TrTwUQjwZSEr1BgDryDkchdLcebgdhls7ka0H717ld8PB6r53uifdMWTC46nHJfyCL3m1y5LaEHA_I0BUa32zUsrKXYTcij-QD24oeiKxhaJxIeLGFILUqSx3Bp9mJcQ7anwB5OPUW88219LfaGvcrQyjbx7h3WN9ViglZcR4KBeQpq2lk8J-6r3YETsnBXKOEYZ8n2zPZJWqjYJvyyHzvgNvPhC-hQ2Pm',
  state: 'Relaxed Alertness'
}

export const useAuthStore = defineStore('auth', () => {
  const userCookie = useCookie<UserProfile | null>(STORAGE_KEY, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  })

  const user = ref<UserProfile | null>(null)

  function loadUserFromStorage() {
    // 1. Check cookie (works on both SSR and client)
    if (userCookie.value && !userCookie.value.isGuest) {
      user.value = userCookie.value
      return
    }

    // 2. Check localStorage on client if cookie wasn't set or was empty
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.id && !parsed.isGuest) {
            user.value = parsed
            userCookie.value = parsed
            return
          }
        }
      } catch (err) {
        console.error('Failed to parse stored user profile:', err)
      }
    }

    // 3. Fallback to Guest
    user.value = defaultGuest
  }

  // Initial load when store is instantiated
  loadUserFromStorage()

  const isAuthenticated = computed(() => !!user.value && !user.value.isGuest)

  function refreshUserData() {
    if (import.meta.client) {
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
  }

  function saveUser(profile: UserProfile | null) {
    if (profile && !profile.isGuest) {
      user.value = profile
      userCookie.value = profile
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      }
    } else if (profile && profile.isGuest) {
      user.value = profile
      userCookie.value = profile
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY)
      }
    } else {
      user.value = defaultGuest
      userCookie.value = null
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    refreshUserData()
  }

  function loginAsGuest() {
    const guestUser: UserProfile = {
      id: `guest-${Date.now()}`,
      name: 'Guest Researcher',
      isGuest: true,
      avatarUrl: defaultGuest.avatarUrl,
      state: 'Relaxed Alertness'
    }
    saveUser(guestUser)
  }

  async function registerUser(name: string, email: string, password: string) {
    const res = await $fetch<{ success: boolean; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: { name, email, password }
    })
    if (res?.user) {
      saveUser(res.user)
    }
    return res
  }

  async function loginUser(email: string, password: string) {
    const res = await $fetch<{ success: boolean; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    if (res?.user) {
      saveUser(res.user)
    }
    return res
  }

  function logout() {
    saveUser(null)
  }

  return {
    user,
    isAuthenticated,
    loadUserFromStorage,
    loginAsGuest,
    registerUser,
    loginUser,
    logout
  }
})

