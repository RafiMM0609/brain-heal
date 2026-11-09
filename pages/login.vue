<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'
import { getErrorMessage } from '~/utils/error'
import AuthCard from '~/components/features/auth/AuthCard.vue'

definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)
const isGuestLoading = ref(false)

async function handleLogin() {
  errorMessage.value = ''
  if (!email.value || !password.value) {
    errorMessage.value = 'Enter both your email and password.'
    return
  }

  isLoading.value = true
  try {
    await authStore.loginUser(email.value, password.value)
    await router.push(resolveRedirect())
  } catch (err: unknown) {
    errorMessage.value = getErrorMessage(err, 'Incorrect email or password.')
  } finally {
    isLoading.value = false
  }
}

async function handleGuestAccess() {
  errorMessage.value = ''
  isGuestLoading.value = true
  try {
    await authStore.loginAsGuest()
    await router.push(resolveRedirect())
  } catch (err: unknown) {
    errorMessage.value = getErrorMessage(err, 'Could not start a guest session. Please try again.')
  } finally {
    isGuestLoading.value = false
  }
}

/** Only follow same-origin, in-app redirect targets. */
function resolveRedirect() {
  const target = route.query.redirect
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
    return target
  }
  return '/'
}
</script>

<template>
  <AuthCard
    v-model:error-message="errorMessage"
    subtitle="Cognitive calm productivity platform"
    divider-label="or sign in with email"
    :is-guest-loading="isGuestLoading"
    @guest="handleGuestAccess"
  >
    <form @submit.prevent="handleLogin" class="space-y-4" novalidate>
      <div>
        <label for="login-email" class="block text-label-sm font-semibold text-on-surface mb-1.5">Email address</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          autocapitalize="none"
          autocorrect="off"
          enterkeyhint="next"
          required
          placeholder="you@example.com"
          :disabled="isLoading"
          :aria-invalid="!!errorMessage"
          class="w-full min-h-12 px-3 bg-surface-container-low border border-surface-variant rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright disabled:opacity-50"
        >
      </div>

      <div>
        <label for="login-password" class="block text-label-sm font-semibold text-on-surface mb-1.5">Password</label>
        <div class="relative">
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            enterkeyhint="go"
            required
            placeholder="••••••••"
            :disabled="isLoading"
            :aria-invalid="!!errorMessage"
            class="w-full min-h-12 pl-3 pr-12 bg-surface-container-low border border-surface-variant rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright disabled:opacity-50"
          >
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-0.5 top-1/2 -translate-y-1/2 min-h-11 min-w-11 flex items-center justify-center text-on-surface-variant hover:text-primary rounded-lg transition-colors"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            :aria-pressed="showPassword"
          >
            <Icon :name="showPassword ? 'material-symbols:visibility-off' : 'material-symbols:visibility'" class="text-[20px]" aria-hidden="true" />
          </button>
        </div>
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full min-h-12 py-3 mt-2 bg-primary text-on-primary rounded-xl font-bold text-base hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Icon v-if="isLoading" name="material-symbols:progress-activity" class="animate-spin text-[20px]" aria-hidden="true" />
        <span>{{ isLoading ? 'Signing in…' : 'Sign in' }}</span>
      </button>
    </form>

    <div class="mt-6 text-center text-sm text-on-surface-variant">
      Don't have an account?
      <NuxtLink to="/register" class="inline-flex min-h-11 items-center px-1 text-primary font-bold hover:underline rounded">
        Create one
      </NuxtLink>
    </div>
  </AuthCard>
</template>
