export const useSidebarState = () => {
  const isCollapsed = useState<boolean>('sidebar_collapsed', () => false)

  // Persist preference in localStorage on client side
  if (import.meta.client) {
    onMounted(() => {
      const saved = localStorage.getItem('sidebar_collapsed')
      if (saved !== null) {
        isCollapsed.value = saved === 'true'
      }
    })

    watch(isCollapsed, (newVal) => {
      localStorage.setItem('sidebar_collapsed', String(newVal))
    })
  }

  function toggleSidebar() {
    isCollapsed.value = !isCollapsed.value
  }

  function setCollapsed(val: boolean) {
    isCollapsed.value = val
  }

  return {
    isCollapsed,
    toggleSidebar,
    setCollapsed
  }
}
