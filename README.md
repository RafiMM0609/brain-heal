# Brain Heal (NeuralFlow)

A modern focus and productivity web application built with **Nuxt 3**, **Vue 3**, **Pinia**, and **Tailwind CSS**, integrated with **Upstash Redis** for data persistence.

## 🚀 Features

- 🎯 **Focus Timer & Pomodoro**: Focus session tracker with dynamic tab title indicators and Document Picture-in-Picture (PiP) support.
- 📥 **Inbox & Distraction Dump**: Capture quick thoughts and tasks without breaking focus.
- 🎨 **Responsive UI/UX**: Clean dark-themed aesthetic optimized for mobile and desktop screens.
- ⚡ **Nitro Backend**: Server API routes powered by `@upstash/redis`.

## 🛠️ Tech Stack

- **Framework**: [Nuxt 3](https://nuxt.com/)
- **UI & Styling**: Vue 3, Tailwind CSS, `@nuxt/icon`
- **State Management**: Pinia (`@pinia/nuxt`)
- **Storage/DB**: Upstash Redis (`@upstash/redis`)

## 🚦 Getting Started

### 1. Prerequisites

Make sure you have **Node.js** (v18.x or later) installed.

### 2. Environment Variables

Create a `.env` file in the project root:

```env
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

*(You can refer to `env-dev` for reference configuration)*

### 3. Installation & Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

- `npm run dev` - Starts the development server.
- `npm run build` - Builds the application for production.
- `npm run preview` - Runs the production build locally.
- `npm run lint` - Runs ESLint code check.
- `npm run typecheck` - Performs TypeScript type checking.
