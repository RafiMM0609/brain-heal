import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.ts']
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // Vue's default bundler build is runtime-only, so stubs declared with a
      // `template:` string never compiled and component tests rendered empty
      // trees. The compiler-included build makes those stubs work.
      vue: 'vue/dist/vue.esm-bundler.js'
    }
  }
})
