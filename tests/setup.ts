import { config } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

/**
 * Vitest runs without the Nuxt runtime, so `<ClientOnly>` has no implementation
 * and Vue falls back to rendering an unknown element with its slot dropped —
 * every modal test therefore asserted against an empty tree.
 *
 * Registering pass-through components here (as real render functions, since the
 * bundler build has no template compiler for stub strings) restores the markup
 * those tests inspect.
 */
const Passthrough = (name: string) =>
  defineComponent({
    name,
    setup(_, { slots }) {
      return () => h('div', {}, slots.default ? slots.default() : [])
    }
  })

config.global.components = {
  ...config.global.components,
  ClientOnly: Passthrough('ClientOnly'),
  Icon: defineComponent({
    name: 'Icon',
    props: { name: { type: String, default: '' } },
    setup() {
      return () => h('span', { class: 'icon-stub' })
    }
  })
}
