import type { TaskItem } from '~/types/task'

export function useTaskDetailModal() {
  const isModalOpen = useState<boolean>('global_task_detail_modal_open', () => false)
  const selectedTask = useState<TaskItem | null>('global_task_detail_selected_task', () => null)

  function openTaskDetail(task: TaskItem) {
    selectedTask.value = task
    isModalOpen.value = true
  }

  function closeTaskDetail() {
    isModalOpen.value = false
    selectedTask.value = null
  }

  return {
    isModalOpen,
    selectedTask,
    openTaskDetail,
    closeTaskDetail
  }
}
