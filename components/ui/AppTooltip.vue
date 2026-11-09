<script setup lang="ts">
interface Props {
  text?: string
  title?: string
  align?: 'left' | 'center' | 'right'
  position?: 'top' | 'bottom'
}

const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 9)}`

const props = withDefaults(defineProps<Props>(), {
  text: '',
  title: '',
  align: 'center',
  position: 'top'
})

const alignClasses = computed(() => {
  switch (props.align) {
    case 'right':
      return 'right-0 left-auto'
    case 'left':
      return 'left-0 right-auto'
    case 'center':
    default:
      return 'left-1/2 -translate-x-1/2'
  }
})

const positionClasses = computed(() => {
  return props.position === 'bottom'
    ? 'top-full mt-2.5'
    : 'bottom-full mb-2.5'
})

const arrowClasses = computed(() => {
  const isBottom = props.position === 'bottom'
  const vertical = isBottom
    ? 'bottom-full border-b-surface-container-highest border-t-transparent'
    : 'top-full border-t-surface-container-highest border-b-transparent'

  let horizontal = 'left-1/2 -translate-x-1/2'
  if (props.align === 'right') {
    horizontal = 'right-3'
  } else if (props.align === 'left') {
    horizontal = 'left-3'
  }

  return `${vertical} ${horizontal}`
})
</script>

<template>
  <!--
    Audit A-07: the note was reachable by mouse hover only. The trigger is now a
    focusable button and the bubble also opens on focus / tap, with the content
    exposed through aria-describedby.
  -->
  <div class="relative inline-flex items-center group">
    <slot name="trigger">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-full text-outline hover:text-primary focus-visible:text-primary transition-colors shrink-0 min-h-11 min-w-11 -m-1.5 md:min-h-9 md:min-w-9"
        :aria-describedby="tooltipId"
        :aria-label="title || 'More information'"
      >
        <Icon name="material-symbols:psychology" class="text-[20px]" aria-hidden="true" />
      </button>
    </slot>

    <div
      :id="tooltipId"
      role="tooltip"
      class="pointer-events-none absolute z-[9999] w-64 sm:w-72 max-w-[calc(100vw-2rem)] p-3 bg-surface-container-highest text-on-surface text-xs rounded-xl shadow-2xl border border-surface-variant opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 leading-relaxed"
      :class="[alignClasses, positionClasses]"
    >
      <strong v-if="title" class="block mb-1 text-primary font-bold text-xs">{{ title }}</strong>
      <div class="text-on-surface-variant font-normal">
        <slot>{{ text }}</slot>
      </div>

      <!-- Arrow Indicator -->
      <div
        class="absolute w-0 h-0 border-[6px] border-x-transparent"
        :class="arrowClasses"
      />
    </div>
  </div>
</template>
