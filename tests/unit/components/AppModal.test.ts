import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppModal from '~/components/ui/AppModal.vue'

/**
 * AppModal teleports its dialog to <body>, so assertions have to look at the
 * document rather than the component wrapper. The previous version of this
 * suite queried `wrapper.find(...)`, which asserted against an empty tree even
 * though the dialog itself rendered fine.
 */
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
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  type ModalProps = InstanceType<typeof AppModal>['$props']

  function mountModal(props: ModalProps, slots?: Record<string, string>) {
    return mount(AppModal, {
      props,
      slots,
      attachTo: document.body
    })
  }

  const dialog = () => document.querySelector('[role="dialog"]')

  it('renders modal dialog with proper ARIA attributes when isOpen is true', () => {
    mountModal({ isOpen: true, title: 'Confirm task' })

    const el = dialog()
    expect(el).not.toBeNull()
    expect(el?.getAttribute('aria-modal')).toBe('true')
    expect(el?.getAttribute('aria-labelledby')).toBe('modal-title')

    const titleEl = document.getElementById('modal-title')
    expect(titleEl?.textContent?.trim()).toBe('Confirm task')
  })

  it('does not render a dialog when isOpen is false', () => {
    mountModal({ isOpen: false, title: 'Hidden' })
    expect(dialog()).toBeNull()
  })

  // The dialog lives inside <Teleport>, so its listeners are not visible to
  // `wrapper.emitted()`. Asserting through an `onClose` spy checks the same
  // contract without depending on test-utils' internal event bookkeeping.
  it('emits close event when close button is clicked', async () => {
    const onClose = vi.fn()
    mountModal({ isOpen: true, title: 'Detail task', onClose })
    await nextFrame()

    const closeBtn = document.querySelector<HTMLButtonElement>('button[aria-label="Close dialog"]')
    expect(closeBtn).not.toBeNull()

    closeBtn?.click()
    await nextFrame()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('emits close event when Escape key is pressed while modal is open', async () => {
    const onClose = vi.fn()
    mountModal({ isOpen: true, title: 'Shortcut test', onClose })
    await nextFrame()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextFrame()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not emit close event on Escape if isOpen is false', async () => {
    const onClose = vi.fn()
    mountModal({ isOpen: false, title: 'Closed modal', onClose })
    await nextFrame()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextFrame()

    expect(onClose).not.toHaveBeenCalled()
  })

  // --- Behaviour added by the UI/UX remediation -----------------------------

  it('locks page scroll while open and restores it on close', async () => {
    const wrapper = mountModal({ isOpen: true, title: 'Scroll lock' })
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.setProps({ isOpen: false })
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('moves focus into the dialog on open', async () => {
    mountModal({ isOpen: true, title: 'Focus trap' }, {
      default: '<button type="button">first</button><button type="button">last</button>'
    })
    await nextFrame()

    const el = dialog()
    expect(el).not.toBeNull()
    expect(el?.contains(document.activeElement)).toBe(true)
  })

  it('does not close when the backdrop is clicked and closeOnBackdrop is false', async () => {
    const onClose = vi.fn()
    mountModal({ isOpen: true, title: 'Forced', closeOnBackdrop: false, onClose })
    await nextFrame()

    const backdrop = dialog()?.parentElement
    backdrop?.dispatchEvent(new MouseEvent('click'))
    await nextFrame()

    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes when the backdrop is clicked by default', async () => {
    const onClose = vi.fn()
    mountModal({ isOpen: true, title: 'Backdrop', onClose })
    await nextFrame()

    const backdrop = dialog()?.parentElement
    backdrop?.dispatchEvent(new MouseEvent('click'))
    await nextFrame()

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

function nextFrame() {
  return new Promise((resolve) => setTimeout(resolve, 40))
}
