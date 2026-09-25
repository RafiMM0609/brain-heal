import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    apiFetch: vi.fn().mockResolvedValue({ task: null })
  }),
  getClientId: () => 'test-client-id'
}))

import { useTaskStore } from '~/stores/useTaskStore'

describe('stores/useTaskStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default seed tasks', () => {
    const store = useTaskStore()
    expect(store.tasks.length).toBeGreaterThan(0)
    expect(store.rawInbox.length).toBe(store.tasks.length)
  })

  it('correctly categorizes tasks into priority matrix getters', () => {
    const store = useTaskStore()
    store.tasks = [
      { id: '1', title: 'Task 1', quadrant: 'inbox', createdAt: '', completed: false },
      { id: '2', title: 'Task 2', quadrant: 'do-first', createdAt: '', completed: false },
      { id: '3', title: 'Task 3', quadrant: 'schedule', createdAt: '', completed: false },
      { id: '4', title: 'Task 4', quadrant: 'delegate', createdAt: '', completed: false },
      { id: '5', title: 'Task 5', quadrant: 'eliminate', createdAt: '', completed: false },
      { id: '6', title: 'Task 6', quadrant: 'do-first', createdAt: '', completed: true } // completed
    ]

    expect(store.rawInbox.map(t => t.id)).toEqual(['1'])
    expect(store.doFirstTasks.map(t => t.id)).toEqual(['2'])
    expect(store.scheduleTasks.map(t => t.id)).toEqual(['3'])
    expect(store.delegateTasks.map(t => t.id)).toEqual(['4'])
    expect(store.eliminateTasks.map(t => t.id)).toEqual(['5'])
    expect(store.completedTasks.map(t => t.id)).toEqual(['6'])
  })

  it('adds new task to the top of raw inbox', async () => {
    const store = useTaskStore()
    const initialCount = store.tasks.length

    const newTask = await store.addTask('Write unit tests for NeuralFlow', 'inbox')

    expect(store.tasks.length).toBe(initialCount + 1)
    expect(store.tasks[0].title).toBe('Write unit tests for NeuralFlow')
    expect(newTask?.title).toBe('Write unit tests for NeuralFlow')
    expect(store.tasks[0].completed).toBe(false)
  })

  it('moves task to another quadrant', async () => {
    const store = useTaskStore()
    const task = store.tasks[0]

    await store.moveTask(task.id, 'do-first')
    expect(task.quadrant).toBe('do-first')
    expect(store.doFirstTasks.some(t => t.id === task.id)).toBe(true)
  })

  it('toggles task completion status', async () => {
    const store = useTaskStore()
    const task = store.tasks[0]
    expect(task.completed).toBe(false)

    await store.toggleTaskComplete(task.id)
    expect(task.completed).toBe(true)

    await store.toggleTaskComplete(task.id)
    expect(task.completed).toBe(false)
  })

  it('deletes task by id', async () => {
    const store = useTaskStore()
    const targetId = store.tasks[0].id
    const initialCount = store.tasks.length

    await store.deleteTask(targetId)

    expect(store.tasks.length).toBe(initialCount - 1)
    expect(store.tasks.some(t => t.id === targetId)).toBe(false)
  })

  it('clears all tasks', async () => {
    const store = useTaskStore()
    expect(store.tasks.length).toBeGreaterThan(0)

    await store.clearAllTasks()
    expect(store.tasks).toEqual([])
  })
})
