<script setup lang="ts">
/**
 * Komponen: AppButton
 * Deskripsi: Komponen Button standar dengan varian style & state loading.
 */

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  isLoading: false,
  disabled: false,
  type: 'button'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  // Size classes
  props.size === 'sm' ? 'px-3 py-1.5 text-sm' : '',
  props.size === 'md' ? 'px-4 py-2.5 text-base' : '',
  props.size === 'lg' ? 'px-6 py-3.5 text-lg font-semibold' : '',
  // Variant classes
  props.variant === 'primary' ? 'bg-primary text-on-primary hover:bg-primary-container shadow-sm' : '',
  props.variant === 'secondary' ? 'bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container' : '',
  props.variant === 'outline' ? 'border border-outline text-primary hover:bg-surface-container-low' : '',
  props.variant === 'danger' ? 'bg-error text-on-error hover:bg-error-container hover:text-on-error-container' : ''
])

function handleClick(event: MouseEvent) {
  if (props.disabled || props.isLoading) return
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || isLoading"
    @click="handleClick"
  >
    <span v-if="isLoading" class="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    <slot />
  </button>
</template>
