import { describe, it, expect, vi } from 'vitest'
import { useTaskDragDrop } from '~/composables/useTaskDragDrop'

describe('composables/useTaskDragDrop', () => {
  it('initializes with null state', () => {
    const { draggedTaskId, activeDragOverQuadrant } = useTaskDragDrop()
    expect(draggedTaskId.value).toBeNull()
    expect(activeDragOverQuadrant.value).toBeNull()
  })

  it('updates state onDragStart and sets dataTransfer', () => {
    const { draggedTaskId, onDragStart } = useTaskDragDrop()
    const setDataMock = vi.fn()
    const mockEvent = {
      dataTransfer: {
        effectAllowed: '',
        setData: setDataMock
      }
    } as unknown as DragEvent

    onDragStart(mockEvent, 'task-123')
    expect(draggedTaskId.value).toBe('task-123')
    expect(mockEvent.dataTransfer?.effectAllowed).toBe('move')
    expect(setDataMock).toHaveBeenCalledWith('text/plain', 'task-123')
  })

  it('updates activeDragOverQuadrant onDragOver and prevents default', () => {
    const { activeDragOverQuadrant, onDragOver } = useTaskDragDrop()
    const preventDefaultMock = vi.fn()
    const mockEvent = {
      preventDefault: preventDefaultMock,
      dataTransfer: {
        dropEffect: ''
      }
    } as unknown as DragEvent

    onDragOver(mockEvent, 'do-first')
    expect(preventDefaultMock).toHaveBeenCalled()
    expect(activeDragOverQuadrant.value).toBe('do-first')
    expect(mockEvent.dataTransfer?.dropEffect).toBe('move')
  })

  it('clears activeDragOverQuadrant onDragLeave for matching quadrant', () => {
    const { activeDragOverQuadrant, onDragOver, onDragLeave } = useTaskDragDrop()
    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {}
    } as unknown as DragEvent

    onDragOver(mockEvent, 'schedule')
    expect(activeDragOverQuadrant.value).toBe('schedule')

    // Leave a different quadrant should not clear
    onDragLeave('delegate')
    expect(activeDragOverQuadrant.value).toBe('schedule')

    // Leave the active quadrant should clear
    onDragLeave('schedule')
    expect(activeDragOverQuadrant.value).toBeNull()
  })

  it('invokes callback onDrop with taskId and targetQuadrant, then resets drag state', () => {
    const { draggedTaskId, activeDragOverQuadrant, onDragStart, onDragOver, onDrop } = useTaskDragDrop()
    const mockMoveCallback = vi.fn()
    const preventDefaultMock = vi.fn()
    const mockEvent = {
      preventDefault: preventDefaultMock,
      dataTransfer: {
        getData: vi.fn().mockReturnValue('task-999'),
        setData: vi.fn()
      }
    } as unknown as DragEvent

    onDragStart(mockEvent, 'task-999')
    onDragOver(mockEvent, 'delegate')

    onDrop(mockEvent, 'delegate', mockMoveCallback)

    expect(preventDefaultMock).toHaveBeenCalled()
    expect(mockMoveCallback).toHaveBeenCalledWith('task-999', 'delegate')
    expect(draggedTaskId.value).toBeNull()
    expect(activeDragOverQuadrant.value).toBeNull()
  })

  it('detects recent drag action with wasJustDragged', () => {
    const { onDragEnd, wasJustDragged } = useTaskDragDrop()
    onDragEnd()
    expect(wasJustDragged(500)).toBe(true)
  })
})
