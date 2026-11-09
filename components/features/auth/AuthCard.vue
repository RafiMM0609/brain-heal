<script setup lang="ts">
/**
 * Shared shell for the login and register screens.
 *
 * Audit C-05: both pages were near-identical copies of the same markup, which
 * is how they drifted apart (different copy, different guest-button labels).
 * The brand header, guest CTA, divider and error banner now live in one place.
 */
interface Props {
  subtitle: string
  dividerLabel: string
  isGuestLoading?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'guest'): void
}>()

const errorMessage = defineModel<string>('errorMessage', { default: '' })
</script>

<template>
  <div class="w-full max-w-md bg-surface p-6 sm:p-8 rounded-2xl border border-surface-variant shadow-lg flex flex-col">
    <!-- Brand Header -->
    <div class="text-center mb-7">
      <div class="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mx-auto mb-3">
        <Icon name="material-symbols:psychology" class="text-[32px]" aria-hidden="true" />
      </div>
      <h1 class="text-display-lg font-bold text-primary mb-1">NeuralFlow</h1>
      <p class="text-body-md text-on-surface-variant">{{ subtitle }}</p>
    </div>

    <!-- Guest access (one clear secondary path) -->
    <button
      type="button"
      @click="emit('guest')"
      :disabled="isGuestLoading"
      class="w-full min-h-12 py-3 mb-6 bg-secondary-container text-on-secondary-container rounded-xl font-bold text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm border border-secondary/20 disabled:opacity-60"
    >
      <Icon
        :name="isGuestLoading ? 'material-symbols:progress-activity' : 'material-symbols:bolt'"
        class="text-[20px]"
        :class="{ 'animate-spin': isGuestLoading }"
        aria-hidden="true"
      />
      <span>{{ isGuestLoading ? 'Setting up guest session…' : 'Continue as guest' }}</span>
    </button>

    <div class="relative flex py-2 items-center mb-6">
      <div class="flex-grow border-t border-surface-variant" />
      <span class="flex-shrink mx-4 text-xs font-semibold uppercase text-on-surface-variant">{{ dividerLabel }}</span>
      <div class="flex-grow border-t border-surface-variant" />
    </div>

    <!-- Error Alert Banner -->
    <!-- Audit A/feedback: announced immediately, and errors are never silent. -->
    <div
      v-if="errorMessage"
      role="alert"
      class="mb-4 p-3.5 rounded-xl bg-error-container text-on-error-container border border-error/25 flex items-start gap-2.5 text-sm"
    >
      <Icon name="material-symbols:warning-rounded" class="text-[20px] shrink-0 mt-0.5" aria-hidden="true" />
      <span>{{ errorMessage }}</span>
    </div>

    <slot />
  </div>
</template>
