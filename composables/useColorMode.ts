/**
 * Colour-scheme management.
 *
 * The Tailwind config declares `darkMode: 'class'` and the palette is driven by
 * CSS custom properties (assets/css/main.css), so all this composable has to do
 * is keep the `.dark` class on <html> in sync with the user's choice and the OS
 * preference.
 *
 * Resolution order: explicit user choice (localStorage) > OS preference.
 */
export type ColorMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'neuralflow-color-mode'

export function useColorMode() {
  const mode = useState<ColorMode>('color-mode', () => 'system')
  const isDark = useState<boolean>('color-mode-is-dark', () => false)

  function systemPrefersDark(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  function apply(next: ColorMode) {
    mode.value = next
    if (typeof document === 'undefined') return

    const dark = next === 'dark' || (next === 'system' && systemPrefersDark())
    isDark.value = dark
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'

    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be unavailable (private mode / blocked cookies).
    }
  }

  function toggle() {
    apply(isDark.value ? 'light' : 'dark')
  }

  /** Restores the stored preference and hooks the OS listener. Idempotent. */
  function init() {
    if (typeof window === 'undefined') return

    let stored: ColorMode = 'system'
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === 'light' || raw === 'dark') stored = raw
    } catch {
      // Ignore unavailable storage.
    }

    apply(stored)

    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return

    const onChange = () => {
      if (mode.value === 'system') apply('system')
    }

    // `addEventListener` is not implemented by older Safari.
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange)
    else mq.addListener?.(onChange)
  }

  return { mode, isDark, init, apply, toggle }
}
