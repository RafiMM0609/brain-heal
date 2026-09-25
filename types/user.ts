export interface UserProfile {
  id: string
  name: string
  email?: string
  isGuest: boolean
  avatarUrl: string
  state: 'Relaxed Alertness' | 'Deep Focus' | 'Recharge'
}

export interface UserAccount {
  id: string
  name: string
  email: string
  password?: string
  avatarUrl: string
  state: 'Relaxed Alertness' | 'Deep Focus' | 'Recharge'
  createdAt: string
}
