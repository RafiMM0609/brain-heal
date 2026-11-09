<script setup lang="ts">
/**
 * Branded error page.
 *
 * Audit X-01: the app shipped no `error.vue`, so 404/500 fell back to Nuxt's
 * default page — different palette, different language, no way back in.
 */
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error?.statusCode === 404)

const title = computed(() => (isNotFound.value ? 'We could not find that page' : 'Something went wrong'))

const description = computed(() =>
  isNotFound.value
    ? 'The page may have moved, or the link might be incomplete.'
    : 'An unexpected error interrupted the session. Your tasks are safe.'
)

function goHome() {
  clearError({ redirect: '/' })
}

function goBack() {
  clearError()
  if (import.meta.client) window.history.back()
}
</script>

<template>
  <div class="min-h-screen bg-background text-on-background flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-surface rounded-2xl border border-surface-variant shadow-lg p-6 sm:p-8 text-center">
      <div class="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mx-auto mb-4">
        <Icon
          :name="isNotFound ? 'material-symbols:search-off' : 'material-symbols:error'"
          class="text-[30px]"
          aria-hidden="true"
        />
      </div>

      <p class="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant mb-1">
        Error {{ error?.statusCode || 500 }}
      </p>
      <h1 class="text-headline-lg font-bold text-primary mb-2">{{ title }}</h1>
      <p class="text-body-md text-on-surface-variant mb-6">{{ description }}</p>

      <div class="flex flex-col-reverse sm:flex-row gap-2 sm:justify-center">
        <button
          type="button"
          @click="goBack"
          class="min-h-12 sm:min-h-0 px-4 py-2.5 rounded-xl border border-surface-variant text-on-surface-variant font-semibold text-sm hover:bg-surface-container-low transition-colors"
        >
          Go back
        </button>
        <button
          type="button"
          @click="goHome"
          class="min-h-12 sm:min-h-0 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors"
        >
          Back to Prep
        </button>
      </div>
    </div>
  </div>
</template>
