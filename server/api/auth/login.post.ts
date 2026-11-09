import {
  verifyUserPassword,
  hashPassword,
  createSession,
  setSessionCookie
} from '~/server/utils/auth'
import { findUserByEmail, updateUser, normaliseEmail } from '~/server/utils/users'
import { enforceRateLimit } from '~/server/utils/rateLimit'

interface LoginRequestBody {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  // Audit H4: online password guessing must be rate limited.
  await enforceRateLimit(event, 'auth:login', 10, 60)

  const body = await readBody<LoginRequestBody>(event)
  const { email, password } = body || {}

  if (!email || typeof email !== 'string' || !email.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Email wajib diisi.' })
  }
  if (!password || typeof password !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Password wajib diisi.' })
  }

  const cleanEmail = normaliseEmail(email).slice(0, 254)
  const user = await findUserByEmail(cleanEmail)

  // Always perform one comparison so a missing account and a wrong password
  // cost the same. Handles both scrypt hashes and legacy plaintext records.
  const { ok, needsRehash } = await verifyUserPassword(password, user?.password)

  if (!user || !ok) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email atau password salah.'
    })
  }

  // Upgrade a legacy plaintext record on first successful login. This writes
  // only this user's hash field, so it cannot clobber a concurrent registration.
  if (needsRehash) {
    await updateUser({ ...user, password: await hashPassword(password) })
  }

  const session = await createSession(user.id, false)
  setSessionCookie(event, session.token)

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isGuest: false,
      avatarUrl: user.avatarUrl,
      state: user.state
    }
  }
})
