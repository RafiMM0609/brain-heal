import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>({
    id: 'guest-1',
    name: 'Cognitive Lab Guest',
    isGuest: true,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaqN2vR_ltj1O12xsA93TrTwUQjwZSEr1BgDryDkchdLcebgdhls7ka0H717ld8PB6r53uifdMWTC46nHJfyCL3m1y5LaEHA_I0BUa32zUsrKXYTcij-QD24oeiKxhaJxIeLGFILUqSx3Bp9mJcQ7anwB5OPUW88219LfaGvcrQyjbx7h3WN9ViglZcR4KBeQpq2lk8J-6r3YETsnBXKOEYZ8n2zPZJWqjYJvyyHzvgNvPhC-hQ2Pm',
    state: 'Relaxed Alertness'
  })

  const isAuthenticated = computed(() => user.value !== null)

  function loginAsGuest() {
    user.value = {
      id: `guest-${Date.now()}`,
      name: 'Guest Researcher',
      isGuest: true,
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaqN2vR_ltj1O12xsA93TrTwUQjwZSEr1BgDryDkchdLcebgdhls7ka0H717ld8PB6r53uifdMWTC46nHJfyCL3m1y5LaEHA_I0BUa32zUsrKXYTcij-QD24oeiKxhaJxIeLGFILUqSx3Bp9mJcQ7anwB5OPUW88219LfaGvcrQyjbx7h3WN9ViglZcR4KBeQpq2lk8J-6r3YETsnBXKOEYZ8n2zPZJWqjYJvyyHzvgNvPhC-hQ2Pm',
      state: 'Relaxed Alertness'
    }
  }

  function loginWithEmail(email: string, name: string) {
    user.value = {
      id: `user-${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      isGuest: false,
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaqN2vR_ltj1O12xsA93TrTwUQjwZSEr1BgDryDkchdLcebgdhls7ka0H717ld8PB6r53uifdMWTC46nHJfyCL3m1y5LaEHA_I0BUa32zUsrKXYTcij-QD24oeiKxhaJxIeLGFILUqSx3Bp9mJcQ7anwB5OPUW88219LfaGvcrQyjbx7h3WN9ViglZcR4KBeQpq2lk8J-6r3YETsnBXKOEYZ8n2zPZJWqjYJvyyHzvgNvPhC-hQ2Pm',
      state: 'Relaxed Alertness'
    }
  }

  function logout() {
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    loginAsGuest,
    loginWithEmail,
    logout
  }
})
