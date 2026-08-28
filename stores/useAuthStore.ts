import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/user'

const STORAGE_KEY = 'neuralflow_user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)

  // Initialize state from localStorage if available
  if (import.meta.client) {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        user.value = JSON.parse(saved)
      } catch (err) {
        console.error('Failed to parse stored user profile:', err)
      }
    }
  }

  // Fallback to guest if no saved session
  if (!user.value) {
    user.value = {
      id: 'guest-1',
      name: 'Cognitive Lab Guest',
      isGuest: true,
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaqN2vR_ltj1O12xsA93TrTwUQjwZSEr1BgDryDkchdLcebgdhls7ka0H717ld8PB6r53uifdMWTC46nHJfyCL3m1y5LaEHA_I0BUa32zUsrKXYTcij-QD24oeiKxhaJxIeLGFILUqSx3Bp9mJcQ7anwB5OPUW88219LfaGvcrQyjbx7h3WN9ViglZcR4KBeQpq2lk8J-6r3YETsnBXKOEYZ8n2zPZJWqjYJvyyHzvgNvPhC-hQ2Pm',
      state: 'Relaxed Alertness'
    }
  }

  const isAuthenticated = computed(() => user.value !== null)

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
    user.value = profile
    if (import.meta.client) {
      if (profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
      refreshUserData()
    }
  }

  function loginAsGuest() {
    const guestUser: UserProfile = {
      id: `guest-${Date.now()}`,
      name: 'Guest Researcher',
      isGuest: true,
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaqN2vR_ltj1O12xsA93TrTwUQjwZSEr1BgDryDkchdLcebgdhls7ka0H717ld8PB6r53uifdMWTC46nHJfyCL3m1y5LaEHA_I0BUa32zUsrKXYTcij-QD24oeiKxhaJxIeLGFILUqSx3Bp9mJcQ7anwB5OPUW88219LfaGvcrQyjbx7h3WN9ViglZcR4KBeQpq2lk8J-6r3YETsnBXKOEYZ8n2zPZJWqjYJvyyHzvgNvPhC-hQ2Pm',
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
    loginAsGuest,
    registerUser,
    loginUser,
    logout
  }
})
