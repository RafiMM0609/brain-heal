import { createSession, setSessionCookie, newGuestId } from '~/server/utils/auth'
import { enforceRateLimit } from '~/server/utils/rateLimit'

/**
 * Issues an isolated guest tenant. Each guest gets a random server-generated id,
 * so guests never share data with each other or with registered users.
 */
export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'auth:guest', 10, 60)

  const guestId = newGuestId()
  const session = await createSession(guestId, true)
  setSessionCookie(event, session.token)

  return {
    success: true,
    user: {
      id: guestId,
      name: 'Guest Researcher',
      isGuest: true,
      avatarUrl: '',
      state: 'Relaxed Alertness'
    }
  }
})
