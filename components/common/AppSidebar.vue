<script setup lang="ts">
import { useAuthStore } from '~/stores/useAuthStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

function navigateToExecute() {
  router.push('/execute')
}
</script>

<template>
  <nav class="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col p-6 z-40 bg-surface-container-low border-r border-outline-variant">
    <!-- Header / Brand -->
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAao3QwwHMAM-b6FMmuzfoxU-svHKJMDadY4C5JBpTlJ9IfLBQjbY5aKCGL3JRMTNuDOTsp4S9SOPkTqAJLAU-jirtIlATQcalX2zIu6PRFE5G9Wub6JQDxwoKX-aYxW8JAtUk4hPkBj4J0ISqqxD8srXZjJqONMOJIPF9H1etGLkHY5ZesiCnWHX-6XLXBYgebT36KxSYfqTwButT_k5xPPY3T8Yy-KAtdYQQh2GXmFXADdRONhEKe"
          alt="Cognitive Lab Logo"
          class="w-full h-full object-cover"
        />
      </div>
      <div>
        <h1 class="text-headline-md font-bold text-primary truncate">Cognitive Lab</h1>
        <p class="text-label-sm text-on-surface-variant truncate">
          {{ authStore.user?.state || 'Relaxed Alertness' }}
        </p>
      </div>
    </div>

    <!-- Quick Action Button -->
    <button
      @click="navigateToExecute"
      class="w-full py-3 mb-8 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:bg-primary-container transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
    >
      <Icon name="material-symbols:bolt" class="text-[20px]" />
      Start Deep Work
    </button>

    <!-- Main Navigation Links -->
    <div class="flex flex-col gap-2 flex-grow">
      <NuxtLink
        to="/"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
        :class="route.path === '/' ? 'text-primary font-bold bg-primary-fixed/30' : 'text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-high'"
      >
        <Icon name="material-symbols:edit-note" class="text-[24px]" />
        <span class="text-label-md">Prep</span>
      </NuxtLink>

      <NuxtLink
        to="/execute"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
        :class="route.path === '/execute' ? 'text-primary font-bold bg-primary-fixed/30' : 'text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-high'"
      >
        <Icon name="material-symbols:bolt" class="text-[24px]" />
        <span class="text-label-md">Execute</span>
      </NuxtLink>

      <NuxtLink
        to="/recovery"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
        :class="route.path === '/recovery' ? 'text-primary font-bold bg-primary-fixed/30' : 'text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-high'"
      >
        <Icon name="material-symbols:self-improvement" class="text-[24px]" />
        <span class="text-label-md">Recovery</span>
      </NuxtLink>

      <NuxtLink
        to="/share"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
        :class="route.path === '/share' ? 'text-primary font-bold bg-primary-fixed/30' : 'text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-high'"
      >
        <Icon name="material-symbols:content-paste-go" class="text-[24px]" />
        <span class="text-label-md">Media Share</span>
      </NuxtLink>
    </div>

    <!-- Secondary Links -->
    <div class="mt-auto pt-6 border-t border-outline-variant flex flex-col gap-2">
      <NuxtLink
        to="/insights"
        class="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-high transition-all"
        :class="{ 'text-primary font-bold bg-primary-fixed/30': route.path === '/insights' }"
      >
        <Icon name="material-symbols:monitoring" class="text-[24px]" />
        <span class="text-label-md">Insights</span>
      </NuxtLink>
      
      <NuxtLink
        to="/login"
        class="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-high transition-all"
      >
        <Icon name="material-symbols:account-circle" class="text-[24px]" />
        <span class="text-label-md">Account Settings</span>
      </NuxtLink>
    </div>
  </nav>
</template>
