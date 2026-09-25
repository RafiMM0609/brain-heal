import { ref } from 'vue'
import type { QuadrantType } from '~/types/task'

export function useTaskDragDrop() {
  const draggedTaskId = ref<string | null>(null)
  const activeDragOverQuadrant = ref<QuadrantType | null>(null)
  const justDraggedTimestamp = ref(0)

  function onDragStart(event: DragEvent, taskId: string) {
    draggedTaskId.value = taskId
    justDraggedTimestamp.value = Date.now()
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', taskId)
    }
  }

  function onDragEnd() {
    draggedTaskId.value = null
    activeDragOverQuadrant.value = null
    justDraggedTimestamp.value = Date.now()
  }

  function onDragOver(event: DragEvent, targetQuadrant: QuadrantType) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    activeDragOverQuadrant.value = targetQuadrant
  }

  function onDragLeave(targetQuadrant: QuadrantType) {
    if (activeDragOverQuadrant.value === targetQuadrant) {
      activeDragOverQuadrant.value = null
    }
  }

  function onDrop(
    event: DragEvent,
    targetQuadrant: QuadrantType,
    onMove: (taskId: string, targetQuadrant: QuadrantType) => void
  ) {
    event.preventDefault()
    const taskId = draggedTaskId.value || event.dataTransfer?.getData('text/plain')
    if (taskId) {
      onMove(taskId, targetQuadrant)
    }
    draggedTaskId.value = null
    activeDragOverQuadrant.value = null
    justDraggedTimestamp.value = Date.now()
  }

  function wasJustDragged(thresholdMs = 300): boolean {
    return Date.now() - justDraggedTimestamp.value < thresholdMs
  }

  return {
    draggedTaskId,
    activeDragOverQuadrant,
    justDraggedTimestamp,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    wasJustDragged
  }
}
