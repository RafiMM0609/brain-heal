import { useTaskStore } from '~/stores/useTaskStore'
import { useToast } from '~/composables/useToast'
import type { TaskItem } from '~/types/task'

/**
 * Task-level actions that need UI feedback.
 *
 * Audit F-02: deleting a task used to be permanent and silent. Every delete
 * entry point (card button, context menu, swipe sheet, detail modal) now funnels
 * through here so the user always gets a 6s undo window — which matters because
 * the destructive affordance is small and sits next to the primary action.
 */
export function useTaskActions() {
  const taskStore = useTaskStore()
  const { showUndoToast, showToast } = useToast()

  async function deleteTaskWithUndo(taskId: string) {
    const removed = taskStore.tasks.find((t: TaskItem) => t.id === taskId)
    const result = await taskStore.deleteTask(taskId, { undoable: true })

    if (!result?.success) {
      showToast('Could not delete task. Please try again.', 'error')
      return
    }

    if (removed) {
      showUndoToast(`Deleted “${truncate(removed.title)}”`, () => taskStore.restoreTask(removed))
    } else {
      showToast('Task deleted')
    }
  }

  function truncate(text: string, max = 32) {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text
  }

  return { deleteTaskWithUndo }
}
