# Standard Pengembangan Web Application (Nuxt 3 + Vercel)

Dokumen ini berisi standar arsitektur, konvensi kode, konfigurasi linter/formatter, dan panduan deployment untuk proyek web berbasis **Nuxt 3** dengan target deployment di **Vercel**.

---

## 1. Tech Stack Overview

- **Framework**: [Nuxt 3](https://nuxt.com/) (Vue 3, Composition API, `<script setup lang="ts">`)
- **Language**: TypeScript (Strict Mode)
- **State Management**: Pinia / Nuxt Composables (`useState`)
- **Styling**: Tailwind CSS v4 / Vanilla CSS (dengan CSS Variables & Design Tokens)
- **Linting & Formatting**: `@nuxt/eslint` (ESLint 9 Flat Config) + Prettier / ESLint Stylistic
- **Git Hooks**: Husky + lint-staged
- **Target Deployment**: Vercel Serverless / Edge Functions (`nitro.preset: 'vercel'`)
- **Package Manager**: `pnpm` (direkomendasikan) atau `npm`

---

## 2. Clean Architecture Pattern

Arsitektur aplikasi memisahkan *UI (Presentation)*, *Business Logic*, dan *Data Source* secara ketat untuk memastikan *maintainability*, *testability*, dan *scalability*.

### Layer Architecture Diagram

```
+-------------------------------------------------------+
|                 PRESENTATION LAYER                    |
|  (pages/, components/, layouts/, middleware/)         |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|                  APPLICATION LAYER                    |
|  (composables/, stores/ - State & Use Cases)          |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|                    DOMAIN LAYER                       |
|  (types/, utils/ - Business Models & Interfaces)      |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|               INFRASTRUCTURE / DATA LAYER             |
|  (services/, repositories/, server/ - API Fetching)   |
+-------------------------------------------------------+
```

### Dependency Rules:
1. **Presentation Layer** hanya boleh memanggil **Composables/Stores** atau **Types/Interfaces**. Dilarang melakukan *raw API call* langsung di dalam komponen UI.
2. **Business Logic** diisolasi dalam `composables/` atau `stores/`.
3. **Data Access** diisolasi dalam `services/` atau `repositories/` yang dibungkus oleh `$fetch` / `useFetch`.

---

## 3. Struktur Folder Project

```text
├── .husky/                   # Git Hooks (pre-commit, commit-msg)
├── .vercel/                  # Vercel CLI cache & config
├── assets/                   # Static assets yang diproses bundler (CSS, SASS, Fonts, Icons)
│   └── css/
│       └── main.css          # Design Tokens, CSS Variables, Base Reset
├── components/               # Vue Components (Component-Based Architecture)
│   ├── common/               # Layout-related components (Navbar, Footer, Sidebar)
│   ├── ui/                   # Primitive/Atomic Design System (Button, Modal, Input, Badge)
│   └── features/             # Feature-specific components
│       ├── auth/             # Component khusus modul Auth (LoginForm.vue, etc)
│       └── dashboard/        # Component khusus modul Dashboard
├── composables/              # Reusable state & logic (useAuth, useUser, etc)
├── layouts/                  # App Layouts (default.vue, auth.vue, admin.vue)
├── middleware/               # Route Middlewares (auth.global.ts, guest.ts)
├── pages/                    # File-based routing
│   ├── index.vue
│   ├── login.vue
│   └── dashboard/
│       └── index.vue
├── plugins/                  # Nuxt Plugins (third-party client/server initializers)
├── public/                   # Static files (favicon, robots.txt, public images)
├── repositories/             # API Repository Pattern (Abstraction HTTP Request)
│   └── auth.repository.ts
├── server/                   # Nitro Server Engine (API Routes & Server Middleware)
│   ├── api/                  # Server API endpoints (/api/v1/...)
│   └── middleware/           # Server-side middleware
├── stores/                   # Pinia Stores (Global state management)
├── types/                    # TypeScript interfaces, types, & DTOs
│   ├── api.d.ts
│   └── user.d.ts
├── utils/                    # Helper functions murni (formatting date, string manipulation)
├── .env.example              # Template Environment Variables
├── .gitignore
├── .prettierrc               # Prettier Formatter Config
├── eslint.config.mjs         # ESLint 9 Flat Config (@nuxt/eslint)
├── nuxt.config.ts            # Main Nuxt Configuration
├── package.json
├── tsconfig.json             # TypeScript Config (extends .nuxt/tsconfig.json)
└── vercel.json               # Vercel Deployment Configuration
```

---

## 4. Standar Component-Based Architecture

### 4.1 Prinsip Komponen
1. **Single Responsibility**: Setiap komponen hanya melakukan 1 fungsi spesifik.
2. **Atomic Structure**:
   - `components/ui/`: Komponen primitif tanpa *business logic* (Pure Presentation). Menerima `props` dan memancarkan `emits`.
   - `components/features/`: Komponen yang menghubungkan UI primitif dengan *composable/store logic*.
3. **Naming Convention**:
   - Nama file menggunakan **PascalCase** dan wajib lebih dari satu kata (misal: `AppButton.vue`, bukan `Button.vue`).
   - Komponen UI dasar diawali dengan prefix `App` atau `Base` (`AppInput.vue`, `BaseCard.vue`).

### 4.2 Template Standard Component (`.vue`)

```vue
<script setup lang="ts">
/**
 * Komponen: AppButton
 * Deskripsi: Komponen Button standar dengan varian style & state loading.
 */

// 1. Types & Interfaces
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

// 2. Props Definition dengan Default Value
const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  isLoading: false,
  disabled: false,
  type: 'button'
})

// 3. Emits Definition
const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

// 4. Computed Properties & Local Logic
const buttonClasses = computed(() => [
  'btn',
  `btn-${props.variant}`,
  `btn-${props.size}`,
  { 'is-loading': props.isLoading }
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
    <span v-if="isLoading" class="spinner" aria-hidden="true" />
    <slot v-else />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary, #00dc82);
  color: #ffffff;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}
</style>
```

---

## 5. Formatter, Linter & Code Quality Setup

Project wajib menggunakan **ESLint v9 (Flat Config)** via `@nuxt/eslint` dan **Prettier** untuk menjaga konsistensi gaya penulisan kode.

### 5.1 Package Installation

```bash
pnpm add -D @nuxt/eslint eslint prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged
```

### 5.2 `nuxt.config.ts`

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2026-08-28',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt'
  ],

  eslint: {
    config: {
      standalone: false // Menggunakan eslint.config.mjs
    }
  },

  typescript: {
    strict: true,
    typeCheck: true
  },

  nitro: {
    preset: 'vercel'
  }
})
```

### 5.3 `eslint.config.mjs`

```js
// eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt([
  {
    rules: {
      // Vue Rules
      'vue/multi-word-component-names': 'error',
      'vue/no-v-html': 'warn',
      'vue/require-default-prop': 'off',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],

      // TypeScript Rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Console & Debugging
      'no-console': process.env.NODE_ENV === 'production' ? ['error', { allow: ['warn', 'error'] }] : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
  }
])
```

### 5.4 `.prettierrc`

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 5.5 `package.json` Scripts & `lint-staged`

```json
{
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "typecheck": "vue-tsc --noEmit",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,ts,mjs,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css,scss}": [
      "prettier --write"
    ]
  }
}
```

---

## 6. API Repository & Fetching Standard

Dilarang keras melakukan `fetch` atau `$fetch` langsung di UI component dengan URL hardcoded.

### 6.1 API Repository Pattern (`repositories/user.repository.ts`)

```ts
import type { User, CreateUserDTO } from '~/types/user'

export const userRepository = () => {
  const fetcher = useNuxtApp().$api // Custom instance atau $fetch murni

  return {
    async getUsers(): Promise<User[]> {
      return await $fetch<User[]>('/api/users')
    },

    async getUserById(id: string): Promise<User> {
      return await $fetch<User>(`/api/users/${id}`)
    },

    async createUser(payload: CreateUserDTO): Promise<User> {
      return await $fetch<User>('/api/users', {
        method: 'POST',
        body: payload
      })
    }
  }
}
```

### 6.2 Penggunaan pada Composable (`composables/useUser.ts`)

```ts
import { userRepository } from '~/repositories/user.repository'

export const useUser = () => {
  const repo = userRepository()
  const users = ref([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const fetchUsers = async () => {
    isLoading.value = true
    error.value = null
    try {
      users.value = await repo.getUsers()
    } catch (err) {
      error.value = err as Error
    } finally {
      isLoading.value = false
    }
  }

  return {
    users: readonly(users),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchUsers
  }
}
```

---

## 7. Configuration Deployment Target: Vercel

Nuxt 3 terintegrasi secara native dengan Vercel melalui Nitro Engine.

### 7.1 `vercel.json` Setup

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nuxtjs"
}
```

### 7.2 Environment Variables Standard (`runtimeConfig`)

Gunakan `runtimeConfig` di `nuxt.config.ts` untuk memisahkan variabel **Private (Server-only)** dan **Public (Client & Server)**.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-only (Hanya bisa diakses di Nitro server API / Server Components)
    apiSecretKey: process.env.API_SECRET_KEY,

    // Public (Bisa diakses di Client-side & Server-side via useRuntimeConfig().public)
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
      appEnv: process.env.NUXT_PUBLIC_APP_ENV || 'development'
    }
  }
})
```

> **Catatan Keamanan**:
> Jangan pernah memberikan prefix `NUXT_PUBLIC_` atau memasukkan rahasia (DB Credential, API Secret Key) ke dalam `runtimeConfig.public`.

---

## 8. Git Workflow & Commit Standard

1. **Branch Naming**:
   - Feature: `feat/nama-fitur` (contoh: `feat/user-login`)
   - Bugfix: `fix/nama-bug` (contoh: `fix/navbar-overflow`)
   - Refactor: `refactor/nama-modul` (contoh: `refactor/user-store`)
   - Chores/CI: `chore/vercel-config`

2. **Conventional Commits**:
   - `feat: add user authentication form`
   - `fix: resolve hydration mismatch on theme toggle`
   - `docs: update deployment guidelines`
   - `style: reformat components with prettier`
   - `refactor: extract user table to feature component`

---

## 9. Developer Checklist (Pre-PR)

Sebelum melakukan Pull Request atau Push ke branch `main`/`production`:

- [ ] Kode lulus linting tanpa error (`pnpm lint`)
- [ ] Typechecking TypeScript lulus tanpa error (`pnpm typecheck`)
- [ ] Build lokal berhasil (`pnpm build`)
- [ ] Tidak ada hardcoded API secret / token di client-side code
- [ ] Komponen menggunakan `<script setup lang="ts">` dan `scoped` styles
- [ ] Memenuhi Clean Architecture (Logic di composable/store, UI di component)
