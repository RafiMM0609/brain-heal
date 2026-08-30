export function useSwipeModal() {
  const isSwipeModalOpen = useState<boolean>('global_swipe_modal_open', () => false)

  function openSwipeModal() {
    isSwipeModalOpen.value = true
  }

  function closeSwipeModal() {
    isSwipeModalOpen.value = false
  }

  return {
    isSwipeModalOpen,
    openSwipeModal,
    closeSwipeModal
  }
}
