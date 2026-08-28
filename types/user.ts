export interface UserProfile {
  id: string
  name: string
  email?: string
  isGuest: boolean
  avatarUrl: string
  state: 'Relaxed Alertness' | 'Deep Focus' | 'Recharge'
}
