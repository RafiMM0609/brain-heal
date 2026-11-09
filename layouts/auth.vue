<!-- Audit: the auth screens had no landmark, so axe reported
     `landmark-one-main` on /login and /register. -->
<template>
  <div class="bg-background text-on-background min-h-screen flex flex-col justify-center items-center p-4">
    <main class="w-full flex justify-center">
      <slot />
    </main>
  </div>
</template>
