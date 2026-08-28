import { defineStore } from 'pinia'
import type { DistractionItem } from '~/types/focus'
import { useTaskStore } from '~/stores/useTaskStore'

export const useDistractionStore = defineStore('distractions', () => {
  const { apiFetch } = useApi()
  const distractions = ref<DistractionItem[]>([])
  const isLoading = ref(false)

  async function fetchDistractions() {
    try {
      isLoading.value = true
      const res = await apiFetch<{ distractions: DistractionItem[] }>('/api/distractions')
      if (res && Array.isArray(res.distractions)) {
        distractions.value = res.distractions
      }
    } catch (err) {
      console.error('[DistractionStore] Failed to fetch distractions:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function addDistraction(content: string) {
    const trimmed = content.trim()
    if (!trimmed) return null

    const item: DistractionItem = {
      id: `distraction-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      convertedToTask: false
    }

    distractions.value.unshift(item)

    try {
      const res = await apiFetch<{ distraction: DistractionItem; distractions: DistractionItem[] }>('/api/distractions', {
        method: 'POST',
        body: { content: trimmed }
      })
      if (res && res.distractions) {
        distractions.value = res.distractions
      }
      return res?.distraction || item
    } catch (err) {
      console.error('[DistractionStore] Failed to add distraction:', err)
      return item
    }
  }

  async function convertToTask(id: string) {
    const item = distractions.value.find(d => d.id === id)
    if (item && !item.convertedToTask) {
      const taskStore = useTaskStore()
      await taskStore.addTask(item.content, 'inbox')
      item.convertedToTask = true

      try {
        await apiFetch(`/api/distractions/${id}`, {
          method: 'PATCH',
          body: { convertedToTask: true }
        })
      } catch (err) {
        console.error(`[DistractionStore] Failed to convert distraction ${id}:`, err)
      }
    }
  }

  if (import.meta.client) {
    fetchDistractions()
  }

  return {
    distractions,
    isLoading,
    fetchDistractions,
    addDistraction,
    convertToTask
  }
})
