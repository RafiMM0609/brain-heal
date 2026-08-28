<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'

definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')

function handleRegister() {
  if (email.value) {
    authStore.loginWithEmail(email.value, name.value)
    router.push('/')
  }
}

function handleGuestAccess() {
  authStore.loginAsGuest()
  router.push('/')
}
</script>

<template>
  <div class="w-full max-w-md bg-surface p-8 rounded-2xl border border-surface-variant shadow-lg flex flex-col">
    <!-- Brand Header -->
    <div class="text-center mb-8">
      <div class="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-2xl mx-auto mb-3">
        <Icon name="material-symbols:psychology" class="text-[32px]" />
      </div>
      <h1 class="text-display-lg font-bold text-primary mb-1 text-3xl">NeuralFlow</h1>
      <p class="text-body-md text-on-surface-variant">Create your Cognitive Calm account</p>
    </div>

    <!-- Quick Guest Access Button -->
    <button
      @click="handleGuestAccess"
      class="w-full py-3.5 mb-6 bg-secondary-container text-on-secondary-container rounded-xl font-bold text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm border border-secondary/20"
    >
      <Icon name="material-symbols:bolt" class="text-[20px]" />
      Continue as Guest (Instant Access)
    </button>

    <div class="relative flex py-2 items-center mb-6">
      <div class="flex-grow border-t border-surface-variant"></div>
      <span class="flex-shrink mx-4 text-xs font-semibold uppercase text-outline">or create new account</span>
      <div class="flex-grow border-t border-surface-variant"></div>
    </div>

    <!-- Register Form -->
    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label class="block text-label-sm font-semibold text-on-surface mb-1">Full Name</label>
        <input
          v-model="name"
          type="text"
          required
          placeholder="Dr. Alex Rivera"
          class="w-full p-3 bg-surface-container-low border border-surface-variant rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright outline-none"
        />
      </div>

      <div>
        <label class="block text-label-sm font-semibold text-on-surface mb-1">Email Address</label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="alex@cognitivelab.ai"
          class="w-full p-3 bg-surface-container-low border border-surface-variant rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright outline-none"
        />
      </div>

      <div>
        <label class="block text-label-sm font-semibold text-on-surface mb-1">Password</label>
        <input
          v-model="password"
          type="password"
          required
          placeholder="••••••••"
          class="w-full p-3 bg-surface-container-low border border-surface-variant rounded-lg text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:bg-surface-bright outline-none"
        />
      </div>

      <button
        type="submit"
        class="w-full py-3.5 mt-2 bg-primary text-on-primary rounded-xl font-bold text-base hover:bg-primary-container transition-colors shadow-sm"
      >
        Register Account
      </button>
    </form>

    <!-- Navigation Footer -->
    <div class="mt-6 text-center text-sm text-on-surface-variant">
      Already have an account?
      <NuxtLink to="/login" class="text-primary font-bold hover:underline">
        Sign In
      </NuxtLink>
    </div>
  </div>
</template>
