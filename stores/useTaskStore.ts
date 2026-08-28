import { defineStore } from 'pinia'
import type { TaskItem, QuadrantType } from '~/types/task'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref<TaskItem[]>([
    { id: 'task-1', title: 'Finalize Q3 Strategy Deck', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
    { id: 'task-2', title: 'Reply to vendor emails', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
    { id: 'task-3', title: 'Schedule dentist appointment', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
    { id: 'task-4', title: 'Read industry newsletter', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false },
    { id: 'task-5', title: 'Fix urgent server bug', quadrant: 'inbox', createdAt: new Date().toISOString(), completed: false }
  ])
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
      const res = await $fetch<{ tasks: TaskItem[] }>('/api/tasks')
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
      const res = await $fetch<{ task: TaskItem; tasks: TaskItem[] }>('/api/tasks', {
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
      await $fetch(`/api/tasks/${taskId}`, {
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
        await $fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: { completed: task.completed }
        })
      } catch (err) {
        console.error(`[TaskStore] Failed to toggle task ${taskId}:`, err)
      }
    }
  }

  async function deleteTask(taskId: string) {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }

    try {
      await $fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })
    } catch (err) {
      console.error(`[TaskStore] Failed to delete task ${taskId}:`, err)
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
    deleteTask
  }
})
