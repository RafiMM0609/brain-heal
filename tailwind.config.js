/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#002446',
        'primary-container': '#1a3a5f',
        'on-primary': '#ffffff',
        'on-primary-container': '#87a4cf',
        'primary-fixed': '#d3e3ff',
        'primary-fixed-dim': '#abc8f5',
        'on-primary-fixed': '#001c39',
        'on-primary-fixed-variant': '#2a486e',

        'secondary': '#406840',
        'secondary-container': '#beecb9',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#446c44',
        'secondary-fixed': '#c1eebc',
        'secondary-fixed-dim': '#a5d2a2',

        'tertiary': '#431503',
        'tertiary-container': '#5e2a14',
        'tertiary-fixed': '#ffdbce',
        'tertiary-fixed-dim': '#ffb59a',
        'on-tertiary-fixed': '#380d00',

        'background': '#f8f9fa',
        'on-background': '#191c1d',
        'surface': '#f8f9fa',
        'surface-bright': '#f8f9fa',
        'surface-dim': '#d9dadb',
        'surface-variant': '#e1e3e4',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f4f5',
        'surface-container': '#edeeef',
        'surface-container-high': '#e7e8e9',
        'surface-container-highest': '#e1e3e4',

        'on-surface': '#191c1d',
        'on-surface-variant': '#43474e',
        'outline': '#73777f',
        'outline-variant': '#c3c6cf',

        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a'
      },
      maxWidth: {
        'container-max-width': '1200px'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      spacing: {
        'gutter': '24px',
        'stack-lg': '48px',
        'container-max-width': '1200px',
        'stack-md': '24px',
        'margin-desktop': '48px',
        'margin-mobile': '16px',
        'stack-sm': '12px',
        'unit': '8px'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'headline-lg': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'display-lg': ['Inter', 'sans-serif'],
        'label-md': ['Inter', 'sans-serif'],
        'label-sm': ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
}
