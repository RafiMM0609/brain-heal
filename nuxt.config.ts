import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

// Load .env if exists
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

export default defineNuxtConfig({
  compatibilityDate: '2026-08-28',
  // Audit L1: DevTools must never be enabled in a production build.
  devtools: { enabled: import.meta.dev },

  experimental: {
    appManifest: false,
    viewTransition: true
  },

  runtimeConfig: {
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
  },

  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@nuxtjs/google-fonts'
  ],

  googleFonts: {
    families: {
      Inter: [400, 500, 600, 700]
    },
    display: 'swap',
    download: true,
    inject: true
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  app: {
    head: {
      title: 'NeuralFlow - Neuroscience-Based Productivity Platform',
      // Audit A-01: the document had no `lang` attribute at all, so screen
      // readers read the Indonesian copy with an English voice.
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content' },
        { name: 'description', content: 'Productivity application designed to reduce cognitive load and protect deep work.' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'NeuralFlow' },
        // Mobile-native: the status bar and browser chrome take their colour
        // from `theme-color`. One value means light mode gets a dark bar (or the
        // dark theme gets a white one), so each scheme gets its own — matched to
        // the surface colour at the top of the page, not the brand colour.
        // `useColorMode` rewrites these tags when the user overrides the OS
        // preference with the in-app toggle.
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#f8f9fa' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#16191c' },
        { name: 'color-scheme', content: 'light dark' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: false
  },

  nitro: {
    preset: process.env.VERCEL ? 'vercel' : undefined,
    // Audit M3: reject oversized bodies before they are buffered into memory.
    routeRules: {
      '/api/**': {
        cors: false,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'no-referrer'
        }
      },
      '/**': {
        headers: {
          // Audit H5: baseline hardening headers, applied to every response.
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Content-Security-Policy': [
            "default-src 'self'",
            // `worker-src blob:` is required by the focus timer: its tick loop
            // runs in a Web Worker built from a Blob. Without this directive the
            // worker object is constructed successfully but its script is blocked,
            // so the countdown silently never starts.
            "script-src 'self' 'unsafe-inline'",
            "worker-src 'self' blob:",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://lh3.googleusercontent.com",
            "font-src 'self' data:",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'"
          ].join('; ')
        }
      }
    }
  }
})
