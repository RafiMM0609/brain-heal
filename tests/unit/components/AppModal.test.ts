import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppModal from '~/components/ui/AppModal.vue'

describe('components/ui/AppModal.vue', () => {
  beforeEach(() => {
    vi.stubGlobal('visualViewport', {
      height: 800,
      offsetTop: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const globalStubs = {
    ClientOnly: {
      template: '<div><slot /></div>'
    },
    Teleport: {
      template: '<div><slot /></div>'
    },
    Transition: {
      template: '<div><slot /></div>'
    },
    Icon: {
      template: '<span class="icon-stub" />',
      props: ['name']
    }
  }

  it('renders modal dialog with proper ARIA attributes when isOpen is true', () => {
    const wrapper = mount(AppModal, {
      props: {
        isOpen: true,
        title: 'Konfirmasi Task'
      },
      global: {
        stubs: globalStubs
      }
    })

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.attributes('aria-labelledby')).toBe('modal-title')

    const titleEl = wrapper.find('#modal-title')
    expect(titleEl.exists()).toBe(true)
    expect(titleEl.text()).toBe('Konfirmasi Task')
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(AppModal, {
      props: {
        isOpen: true,
        title: 'Detail Task'
      },
      global: {
        stubs: globalStubs
      }
    })

    const closeBtn = wrapper.find('button[aria-label="Tutup Dialog"]')
    expect(closeBtn.exists()).toBe(true)

    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')?.length).toBe(1)
  })

  it('emits close event when Escape key is pressed while modal is open', async () => {
    const wrapper = mount(AppModal, {
      props: {
        isOpen: true,
        title: 'Shortcut Test'
      },
      global: {
        stubs: globalStubs
      }
    })

    // Simulate Escape key press on window
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(escEvent)

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')?.length).toBe(1)
  })

  it('does not emit close event on Escape if isOpen is false', async () => {
    const wrapper = mount(AppModal, {
      props: {
        isOpen: false,
        title: 'Closed Modal'
      },
      global: {
        stubs: globalStubs
      }
    })

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(escEvent)

    expect(wrapper.emitted('close')).toBeFalsy()
  })
})
