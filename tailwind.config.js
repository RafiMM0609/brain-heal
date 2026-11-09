/** @type {import('tailwindcss').Config} */

/**
 * Colors are exposed as CSS custom properties (see assets/css/main.css) so that a
 * single `.dark` class on <html> re-maps the whole Material-3 palette without
 * duplicating every utility class. The `rgb(var(--x) / <alpha-value>)` form keeps
 * opacity modifiers such as `bg-primary/10` working exactly as before.
 */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`

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
        'primary': token('primary'),
        'primary-container': token('primary-container'),
        'on-primary': token('on-primary'),
        'on-primary-container': token('on-primary-container'),
        'primary-fixed': token('primary-fixed'),
        'primary-fixed-dim': token('primary-fixed-dim'),
        'on-primary-fixed': token('on-primary-fixed'),
        'on-primary-fixed-variant': token('on-primary-fixed-variant'),

        'secondary': token('secondary'),
        'secondary-container': token('secondary-container'),
        'on-secondary': token('on-secondary'),
        'on-secondary-container': token('on-secondary-container'),
        'secondary-fixed': token('secondary-fixed'),
        'secondary-fixed-dim': token('secondary-fixed-dim'),

        'tertiary': token('tertiary'),
        'tertiary-container': token('tertiary-container'),
        'tertiary-fixed': token('tertiary-fixed'),
        'tertiary-fixed-dim': token('tertiary-fixed-dim'),
        'on-tertiary-fixed': token('on-tertiary-fixed'),

        'background': token('background'),
        'on-background': token('on-background'),
        'surface': token('surface'),
        'surface-bright': token('surface-bright'),
        'surface-dim': token('surface-dim'),
        'surface-variant': token('surface-variant'),
        'surface-container-lowest': token('surface-container-lowest'),
        'surface-container-low': token('surface-container-low'),
        'surface-container': token('surface-container'),
        'surface-container-high': token('surface-container-high'),
        'surface-container-highest': token('surface-container-highest'),

        'on-surface': token('on-surface'),
        'on-surface-variant': token('on-surface-variant'),
        'outline': token('outline'),
        'outline-variant': token('outline-variant'),

        'error': token('error'),
        'error-container': token('error-container'),
        'on-error': token('on-error'),
        'on-error-container': token('on-error-container'),

        // Semantic status colours used by the sync badge and toasts. Defined as
        // tokens so both themes pick accessible shades instead of raw
        // `amber-600` (1.48:1) / `emerald-600` pairs.
        'status-online': token('status-online'),
        'status-online-surface': token('status-online-surface'),
        'status-warn': token('status-warn'),
        'status-warn-surface': token('status-warn-surface')
      },

      /**
       * The M3 type scale referenced across the app. Every entry resolves at
       * build time, so `text-headline-md` is a real utility instead of an
       * unknown class (previously the whole scale collapsed to 16px/24px).
       */
      fontSize: {
        'display-lg': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'headline-lg': ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'headline-md': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        'headline-sm': ['1rem', { lineHeight: '1.5' }],
        'title-md': ['1rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'body-lg': ['1rem', { lineHeight: '1.65' }],
        'body-md': ['0.875rem', { lineHeight: '1.6' }],
        'label-md': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'label-sm': ['0.75rem', { lineHeight: '1.45', letterSpacing: '0.02em' }]
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
        'unit': '8px',
        // Referenced by the oversized timer control (`w-18 h-18` -> 72px) and
        // as tap-target sizes elsewhere.
        '18': '4.5rem',
        '20': '5rem',
        '22': '5.5rem'
      },
      boxShadow: {
        // The two elevation steps the design references but Tailwind does not
        // ship by default; previously these classes silently did nothing.
        '2xs': '0 1px 1px 0 rgb(0 0 0 / 0.03)',
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      },
      backdropBlur: {
        xs: '2px'
      },
      minWidth: {
        // Keeps the Raw Inbox column readable on 1024-1280px laptops where the
        // task titles previously collapsed to 0px.
        'inbox': '17rem'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
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
