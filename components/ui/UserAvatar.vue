<script setup lang="ts">
/**
 * Avatar with a graceful fallback.
 *
 * Audit A-08: guest sessions have `avatarUrl: ''`, which the browser resolved as
 * a request to the current document URL — rendering a broken-image icon on every
 * screen. This component shows initials instead and never emits an empty `src`.
 */
interface Props {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  name: '',
  size: 'sm'
})

const imageFailed = ref(false)

const dimensionClass = computed(() => (props.size === 'lg' ? 'w-12 h-12 text-base' : 'w-7 h-7 text-[11px]'))
const borderClass = computed(() =>
  props.size === 'lg' ? 'border-2 border-primary/20' : 'border border-outline-variant'
)

const hasImage = computed(() => !!props.src && !imageFailed.value)

const initials = computed(() => {
  const value = (props.name || '').trim()
  if (!value) return '?'
  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

watch(
  () => props.src,
  () => {
    imageFailed.value = false
  }
)
</script>

<template>
  <img
    v-if="hasImage"
    :src="src || undefined"
    :alt="name || 'User avatar'"
    class="rounded-full object-cover shrink-0"
    :class="[dimensionClass, borderClass]"
    @error="imageFailed = true"
  >
  <span
    v-else
    class="rounded-full shrink-0 inline-flex items-center justify-center font-bold bg-primary-container text-on-primary-container select-none"
    :class="[dimensionClass, borderClass]"
    role="img"
    :aria-label="name ? `${name} avatar` : 'User avatar'"
  >
    {{ initials }}
  </span>
</template>
