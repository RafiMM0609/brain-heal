import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppModal from '~/components/ui/AppModal.vue'

/**
 * Drag-to-dismiss for the mobile bottom sheet.
 *
 * The skill's release rule is "distance OR velocity", so both paths are
 * exercised: a slow drag past the threshold, and a short fast flick. The
 * snap-back path matters just as much — a drag that falls short must not
 * dismiss, or the gesture feels like it fires on any touch.
 */
describe('AppModal sheet drag-to-dismiss', () => {
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

  function mountModal(props: ModalProps) {
    return mount(AppModal, {
      props,
      slots: { default: '<p>body</p>' },
      attachTo: document.body
    })
  }

  const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]')
  const handle = () => document.querySelector<HTMLElement>('[data-sheet-drag-handle]')

  /** happy-dom reports offsetHeight 0, so give the sheet a real height. */
  function stubSheetHeight(el: HTMLElement, height = 400) {
    Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true })
  }

  function pointer(
    type: 'pointerdown' | 'pointermove' | 'pointerup',
    clientY: number,
    timeStamp = 0
  ): PointerEvent {
    const event = new Event(type, { bubbles: true }) as PointerEvent
    Object.defineProperties(event, {
      clientY: { value: clientY },
      pointerId: { value: 1 },
      timeStamp: { value: timeStamp }
    })
    return event
  }

  it('does not dismiss a drag that stops short of the threshold', async () => {
    const onClose = vi.fn()
    mountModal({ isOpen: true, title: 'Short drag', onClose })
    await nextFrame()

    const el = sheet()!
    stubSheetHeight(el, 400)

    handle()!.dispatchEvent(pointer('pointerdown', 100, 0))
    handle()!.dispatchEvent(pointer('pointermove', 150, 400)) // 50px of 160px
    handle()!.dispatchEvent(pointer('pointerup', 150, 800))
    await nextFrame()

    expect(onClose).not.toHaveBeenCalled()
  })

  it('dismisses when the drag passes 40% of the sheet height', async () => {
    const onClose = vi.fn()
    mountModal({ isOpen: true, title: 'Long drag', onClose })
    await nextFrame()

    const el = sheet()!
    stubSheetHeight(el, 400)

    handle()!.dispatchEvent(pointer('pointerdown', 100, 0))
    handle()!.dispatchEvent(pointer('pointermove', 300, 4000)) // 200px > 160px, slow
    handle()!.dispatchEvent(pointer('pointerup', 300, 4200))
    await afterExit()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('dismisses on a fast flick over a short distance', async () => {
    const onClose = vi.fn()
    mountModal({ isOpen: true, title: 'Flick', onClose })
    await nextFrame()

    const el = sheet()!
    stubSheetHeight(el, 400)

    handle()!.dispatchEvent(pointer('pointerdown', 100, 0))
    // 40px in 20ms => 2px/ms, well above the velocity threshold.
    handle()!.dispatchEvent(pointer('pointermove', 140, 20))
    handle()!.dispatchEvent(pointer('pointerup', 140, 30))
    await afterExit()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores a press that starts inside the scrollable body', async () => {
    const onClose = vi.fn()
    mountModal({ isOpen: true, title: 'Body press', onClose })
    await nextFrame()

    const el = sheet()!
    stubSheetHeight(el, 400)
    const body = el.querySelector('p')!

    // Only the handle/header region may start a drag, so tapping content can
    // never turn a scroll into a dismissal.
    body.dispatchEvent(pointer('pointerdown', 100, 0))
    body.dispatchEvent(pointer('pointermove', 400, 4000))
    body.dispatchEvent(pointer('pointerup', 400, 4200))
    await nextFrame()

    expect(onClose).not.toHaveBeenCalled()
  })

  it('clears the dragged offset once the sheet is closed', async () => {
    const wrapper = mountModal({ isOpen: true, title: 'Reset' })
    await nextFrame()

    const el = sheet()!
    stubSheetHeight(el, 400)

    handle()!.dispatchEvent(pointer('pointerdown', 100, 0))
    handle()!.dispatchEvent(pointer('pointermove', 130, 500))
    handle()!.dispatchEvent(pointer('pointerup', 130, 900))

    await wrapper.setProps({ isOpen: false })
    await nextFrame()

    expect(el.style.transform).toBe('')
  })
})

function nextFrame() {
  return new Promise((resolve) => setTimeout(resolve, 40))
}

/**
 * A dismissed sheet finishes its exit animation before `close` is emitted, so
 * the element leaves the screen with the finger's momentum instead of vanishing
 * (the inline `transition` from the track phase outranks the leave class).
 * Wait past that exit before asserting.
 */
function afterExit() {
  return new Promise((resolve) => setTimeout(resolve, 320))
}
