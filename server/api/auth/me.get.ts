import { resolveSession, newGuestId, createSession, setSessionCookie } from '~/server/utils/auth'

/**
 * Returns the currently authenticated user, or 401.
 * The client calls this on boot instead of trusting a client-side cookie.
 */
export default defineEventHandler(async (event) => {
  const resolved = await resolveSession(event)
  if (!resolved) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated.' })
  }
  return { user: resolved.user }
})
