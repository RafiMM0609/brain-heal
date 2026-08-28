export type FocusMode = 'work' | 'shortBreak' | 'longBreak'

export interface FocusSession {
  id: string
  taskId?: string
  taskTitle?: string
  mode: FocusMode
  durationSeconds: number
  elapsedSeconds: number
  isRunning?: boolean
  targetEndTimestamp?: number | null
  completed: boolean
  timestamp: string
}

export interface DistractionItem {
  id: string
  content: string
  createdAt: string
  convertedToTask: boolean
}
