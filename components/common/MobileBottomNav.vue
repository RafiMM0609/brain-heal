<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-bright/90 backdrop-blur-xl border-t border-surface-variant/80 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] flex justify-around items-center shadow-lg"
    aria-label="Mobile Navigation"
  >
    <NuxtLink
      to="/"
      class="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-2xl transition-all active:scale-95"
      :class="route.path === '/' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant hover:text-primary'"
    >
      <Icon name="material-symbols:edit-note" class="text-[20px]" />
      <span class="text-[10px] font-medium tracking-tight">Prep</span>
    </NuxtLink>

    <NuxtLink
      to="/execute"
      class="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-2xl transition-all active:scale-95"
      :class="route.path === '/execute' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant hover:text-primary'"
    >
      <Icon name="material-symbols:bolt" class="text-[20px]" />
      <span class="text-[10px] font-medium tracking-tight">Execute</span>
    </NuxtLink>

    <NuxtLink
      to="/recovery"
      class="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-2xl transition-all active:scale-95"
      :class="route.path === '/recovery' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant hover:text-primary'"
    >
      <Icon name="material-symbols:self-improvement" class="text-[20px]" />
      <span class="text-[10px] font-medium tracking-tight">Recovery</span>
    </NuxtLink>

    <NuxtLink
      to="/share"
      class="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-2xl transition-all active:scale-95"
      :class="route.path === '/share' ? 'text-primary font-bold bg-primary/10' : 'text-on-surface-variant hover:text-primary'"
    >
      <Icon name="material-symbols:content-paste-go" class="text-[20px]" />
      <span class="text-[10px] font-medium tracking-tight">Share</span>
    </NuxtLink>
  </nav>
</template>

