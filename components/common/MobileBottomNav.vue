<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-bright/95 backdrop-blur-md border-t border-surface-variant px-3 py-1.5 flex justify-around items-center shadow-lg pb-safe"
    aria-label="Mobile Navigation"
  >
    <NuxtLink
      to="/"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
      :class="route.path === '/' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'"
    >
      <Icon name="material-symbols:edit-note" class="text-[22px]" />
      <span class="text-[10px] tracking-tight">Prep</span>
    </NuxtLink>

    <NuxtLink
      to="/execute"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
      :class="route.path === '/execute' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'"
    >
      <Icon name="material-symbols:bolt" class="text-[22px]" />
      <span class="text-[10px] tracking-tight">Execute</span>
    </NuxtLink>

    <NuxtLink
      to="/recovery"
      class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
      :class="route.path === '/recovery' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'"
    >
      <Icon name="material-symbols:self-improvement" class="text-[22px]" />
      <span class="text-[10px] tracking-tight">Recovery</span>
    </NuxtLink>
  </nav>
</template>
