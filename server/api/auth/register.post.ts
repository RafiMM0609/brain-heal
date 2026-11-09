import { newUserId, hashPassword, createSession, setSessionCookie } from '~/server/utils/auth'
import { createUser, normaliseEmail, type UserRecord } from '~/server/utils/users'
import { enforceRateLimit } from '~/server/utils/rateLimit'

interface RegisterRequestBody {
  name?: string
  email?: string
  password?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN_PASSWORD_LENGTH = 12

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'auth:register', 5, 60)

  const body = await readBody<RegisterRequestBody>(event)
  const { name, email, password } = body || {}

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nama lengkap wajib diisi.' })
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Email wajib diisi.' })
  }

  const cleanEmail = normaliseEmail(email)
  if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid.' })
  }

  if (!password || typeof password !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Password wajib diisi.' })
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`
    })
  }
  if (password.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Password terlalu panjang.' })
  }

  const newUser: UserRecord = {
    id: newUserId(),
    name: name.trim().slice(0, 120),
    email: cleanEmail,
    // Audit C2: passwords are scrypt-hashed with a per-password random salt.
    password: await hashPassword(password),
    avatarUrl: '',
    state: 'Relaxed Alertness',
    createdAt: new Date().toISOString()
  }

  // Audit M5: uniqueness is enforced by HSETNX inside the datastore, so two
  // simultaneous registrations for one address cannot both succeed.
  const created = await createUser(newUser)

  if (!created) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.'
    })
  }

  const session = await createSession(newUser.id, false)
  setSessionCookie(event, session.token)

  return {
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      isGuest: false,
      avatarUrl: newUser.avatarUrl,
      state: newUser.state
    }
  }
})
