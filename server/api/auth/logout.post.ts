import { getCookie } from 'h3'
import { SESSION_COOKIE, destroySession, clearSessionCookie } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, SESSION_COOKIE)
  await destroySession(token)
  clearSessionCookie(event)
  return { success: true }
})
