import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

// Load env-dev if exists
const envDevPath = path.resolve(process.cwd(), 'env-dev')
if (fs.existsSync(envDevPath)) {
  dotenv.config({ path: envDevPath })
}
// Also load .env if exists
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

export default defineNuxtConfig({
  compatibilityDate: '2026-08-28',
  devtools: { enabled: true },

  runtimeConfig: {
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon'
  ],

  app: {
    head: {
      title: 'NeuralFlow - Neuroscience-Based Productivity Platform',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'description', content: 'Productivity application designed to reduce cognitive load and protect deep work.' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'NeuralFlow' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: false
  },

  nitro: {
    preset: process.env.VERCEL ? 'vercel' : undefined
  }
})
