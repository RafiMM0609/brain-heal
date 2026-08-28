<script setup lang="ts">
interface Props {
  text?: string
  title?: string
}

defineProps<Props>()
</script>

<template>
  <div class="tooltip relative cursor-help inline-block">
    <slot name="trigger">
      <Icon name="material-symbols:psychology" class="text-[18px] text-outline hover:text-primary transition-colors" />
    </slot>
    
    <div class="tooltip-text font-label-sm">
      <strong v-if="title" class="block mb-1 text-white">{{ title }}</strong>
      <slot>{{ text }}</slot>
    </div>
  </div>
</template>
