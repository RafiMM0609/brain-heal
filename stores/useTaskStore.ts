import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import type { TaskItem, QuadrantType } from '~/types/task'

export const useTaskStore = defineStore('tasks', () => {
  const { apiFetch } = useApi()
  /**
   * Audit F-03: the store used to be seeded with five demo tasks that were
   * never persisted anywhere. On a slow/failed fetch (or before signing in)
   * the UI showed them as if they were the user's real data. The list now
   * starts empty and the UI renders a proper empty state instead.
   */
  const tasks = ref<TaskItem[]>([])

  const isLoading = ref(false)

  // Getters
  const rawInbox = computed(() => tasks.value.filter(t => t.quadrant === 'inbox' && !t.completed))
  const doFirstTasks = computed(() => tasks.value.filter(t => t.quadrant === 'do-first' && !t.completed))
  const scheduleTasks = computed(() => tasks.value.filter(t => t.quadrant === 'schedule' && !t.completed))
  const delegateTasks = computed(() => tasks.value.filter(t => t.quadrant === 'delegate' && !t.completed))
  const eliminateTasks = computed(() => tasks.value.filter(t => t.quadrant === 'eliminate' && !t.completed))
  const completedTasks = computed(() => tasks.value.filter(t => t.completed))

  // Actions
  async function fetchTasks() {
    try {
      isLoading.value = true
      const res = await apiFetch<{ tasks: TaskItem[] }>('/api/tasks')
      if (res && Array.isArray(res.tasks)) {
        tasks.value = res.tasks
      }
    } catch (err) {
      console.error('[TaskStore] Failed to fetch tasks:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function addTask(title: string, quadrant: QuadrantType = 'inbox') {
    const trimmed = title.trim()
    if (!trimmed) return null

    const tempTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: trimmed,
      quadrant,
      createdAt: new Date().toISOString(),
      completed: false
    }

    tasks.value.unshift(tempTask)

    try {
      const res = await apiFetch<{ task: TaskItem; tasks: TaskItem[] }>('/api/tasks', {
        method: 'POST',
        body: { title: trimmed, quadrant }
      })
      if (res && res.tasks) {
        tasks.value = res.tasks
      }
      return res?.task || tempTask
    } catch (err) {
      console.error('[TaskStore] Failed to create task on backend:', err)
      return tempTask
    }
  }

  async function moveTask(taskId: string, targetQuadrant: QuadrantType) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.quadrant = targetQuadrant
    }

    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: { quadrant: targetQuadrant }
      })
    } catch (err) {
      console.error(`[TaskStore] Failed to move task ${taskId}:`, err)
    }
  }

  async function toggleTaskComplete(taskId: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.completed = !task.completed
      try {
        await apiFetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: { completed: task.completed }
        })
      } catch (err) {
        console.error(`[TaskStore] Failed to toggle task ${taskId}:`, err)
      }
    }
  }

  /**
   * Removes a task optimistically.
   *
   * Audit F-02: deletion was permanent and irreversible, and the destructive
   * control is only 26x32px on mobile. Passing `{ undoable: true }` keeps the
   * removed task around long enough for the undo toast to restore it.
   */
  async function deleteTask(taskId: string, options: { undoable?: boolean } = {}) {
    const index = tasks.value.findIndex(t => t.id === taskId)
    const removed = index !== -1 ? tasks.value[index] : undefined
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }

    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })
    } catch (err) {
      console.error(`[TaskStore] Failed to delete task ${taskId}:`, err)
      // Put the task back so the UI does not lie about the server state.
      if (removed && !tasks.value.some(t => t.id === removed.id)) {
        tasks.value.splice(index, 0, removed)
      }
      return { success: false, task: removed }
    }

    return { success: true, task: removed, undoable: !!options.undoable }
  }

  /** Restores a previously deleted task (undo toast action). */
  async function restoreTask(task: TaskItem) {
    if (tasks.value.some(t => t.id === task.id)) return
    tasks.value.push(task)
    try {
      const res = await apiFetch<{ tasks: TaskItem[] }>('/api/tasks', {
        method: 'POST',
        body: { title: task.title, quadrant: task.quadrant }
      })
      if (res && Array.isArray(res.tasks)) {
        tasks.value = res.tasks
      }
    } catch (err) {
      console.error('[TaskStore] Failed to restore task:', err)
    }
  }

  async function clearAllTasks() {
    try {
      const res = await apiFetch<{ success: boolean; tasks: TaskItem[] }>('/api/tasks', { method: 'DELETE' })
      // Trust the server list rather than assuming the delete worked.
      tasks.value = Array.isArray(res?.tasks) ? res.tasks : []
    } catch (err) {
      console.error('[TaskStore] Failed to clear tasks:', err)
    }
  }

  async function resetDefaultTasks() {
    try {
      const res = await apiFetch<{ tasks: TaskItem[] }>('/api/tasks?reset=true', { method: 'DELETE' })
      if (res && Array.isArray(res.tasks)) {
        tasks.value = res.tasks
      }
    } catch (err) {
      console.error('[TaskStore] Failed to reset tasks:', err)
    }
  }

  // Fetch tasks when running in client context
  if (import.meta.client) {
    fetchTasks()
  }

  return {
    tasks,
    isLoading,
    rawInbox,
    doFirstTasks,
    scheduleTasks,
    delegateTasks,
    eliminateTasks,
    completedTasks,
    fetchTasks,
    addTask,
    moveTask,
    toggleTaskComplete,
    deleteTask,
    restoreTask,
    clearAllTasks,
    resetDefaultTasks
  }
})
