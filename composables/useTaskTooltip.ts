export interface TooltipState {
  show: boolean
  title: string
  x: number
  y: number
}

export function useTaskTooltip() {
  const tooltipState = useState<TooltipState>('global_task_tooltip_state', () => ({
    show: false,
    title: '',
    x: 0,
    y: 0
  }))

  function showTooltip(event: MouseEvent, title: string) {
    if (!title || typeof window === 'undefined') return

    const target = event.currentTarget as HTMLElement | null
    if (!target) return

    const rect = target.getBoundingClientRect()
    // Position tooltip horizontally centered above the element
    tooltipState.value = {
      show: true,
      title,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    }
  }

  function hideTooltip() {
    tooltipState.value.show = false
  }

  return {
    tooltipState,
    showTooltip,
    hideTooltip
  }
}
