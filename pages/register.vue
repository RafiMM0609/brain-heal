<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'
import { getErrorMessage } from '~/utils/error'
import AuthCard from '~/components/features/auth/AuthCard.vue'

definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)
const isGuestLoading = ref(false)

const passwordHint = 'Use at least 8 characters.'

async function handleRegister() {
  errorMessage.value = ''
  if (!name.value || !email.value || !password.value) {
    errorMessage.value = 'Fill in your name, email and password.'
    return
  }
  if (password.value.length < 8) {
    errorMessage.value = passwordHint
    return
  }

  isLoading.value = true
  try {
    await authStore.registerUser(name.value, email.value, password.value)
    await router.push('/')
  } catch (err: unknown) {
    errorMessage.value = getErrorMessage(err, 'Could not create the account. Please try again.')
  } finally {
    isLoading.value = false
  }
}

async function handleGuestAccess() {
  errorMessage.value = ''
  isGuestLoading.value = true
  try {
    await authStore.loginAsGuest()
    await router.push('/')
  } catch (err: unknown) {
    errorMessage.value = getErrorMessage(err, 'Could not start a guest session. Please try again.')
  } finally {
    isGuestLoading.value = false
  }
}
</script>

<template>
  <AuthCard
    v-model:error-message="errorMessage"
    subtitle="Create your account"
    divider-label="or create new account"
    :is-guest-loading="isGuestLoading"
    @guest="handleGuestAccess"
  >
    <form @submit.prevent="handleRegister" class="space-y-4" novalidate>
      <div>
        <label for="register-name" class="block text-label-sm font-semibold text-on-surface mb-1.5">Full name</label>
        <input
          id="register-name"
          v-model="name"
          type="text"
          autocomplete="name"
          required
          placeholder="Alex Rivera"
          :disabled="isLoading"
          class="w-full min-h-12 px-3 bg-surface-container-low border border-surface-variant rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright disabled:opacity-50"
        >
      </div>

      <div>
        <label for="register-email" class="block text-label-sm font-semibold text-on-surface mb-1.5">Email address</label>
        <input
          id="register-email"
          v-model="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          required
          placeholder="you@example.com"
          :disabled="isLoading"
          class="w-full min-h-12 px-3 bg-surface-container-low border border-surface-variant rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright disabled:opacity-50"
        >
      </div>

      <div>
        <label for="register-password" class="block text-label-sm font-semibold text-on-surface mb-1.5">Password</label>
        <div class="relative">
          <input
            id="register-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            required
            minlength="8"
            placeholder="••••••••"
            :disabled="isLoading"
            aria-describedby="register-password-hint"
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
        <p id="register-password-hint" class="mt-1.5 text-xs text-on-surface-variant">{{ passwordHint }}</p>
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full min-h-12 py-3 mt-2 bg-primary text-on-primary rounded-xl font-bold text-base hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Icon v-if="isLoading" name="material-symbols:progress-activity" class="animate-spin text-[20px]" aria-hidden="true" />
        <span>{{ isLoading ? 'Creating account…' : 'Create account' }}</span>
      </button>
    </form>

    <div class="mt-6 text-center text-sm text-on-surface-variant">
      Already have an account?
      <NuxtLink to="/login" class="inline-flex min-h-11 items-center px-1 text-primary font-bold hover:underline rounded">
        Sign in
      </NuxtLink>
    </div>
  </AuthCard>
</template>
