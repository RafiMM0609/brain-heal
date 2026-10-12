export type CompanionMood = 'idle' | 'typing' | 'focus' | 'break' | 'celebrate' | 'petted' | 'walking' | 'held'

export type CatTheme = 'calico' | 'white' | 'orange' | 'black'

export interface CompanionStats {
  pets: number
  keystrokes: number
}

export interface CompanionSettings {
  enabled: boolean
  soundEnabled: boolean
  name: string
  isMinimized: boolean
  isRoaming: boolean
  theme: CatTheme
  position?: { x: number; y: number } | null
}
