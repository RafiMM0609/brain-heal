export type QuadrantType = 'inbox' | 'do-first' | 'schedule' | 'delegate' | 'eliminate'

export interface TaskItem {
  id: string
  title: string
  quadrant: QuadrantType
  createdAt: string
  completed: boolean
  focusTimeMinutes?: number
}
