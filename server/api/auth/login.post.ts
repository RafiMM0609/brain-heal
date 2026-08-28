import { REDIS_KEYS, redisGet } from '~/server/utils/redis'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body || {}

  if (!email || typeof email !== 'string' || !email.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email wajib diisi.'
    })
  }

  if (!password || typeof password !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password wajib diisi.'
    })
  }

  const cleanEmail = email.trim().toLowerCase()

  // Fetch registered users list from Redis
  const { data: rawUsers } = await redisGet<any[]>(REDIS_KEYS.USERS)
  const users = Array.isArray(rawUsers) ? rawUsers : []

  const user = users.find(
    (u) => u.email && u.email.toLowerCase() === cleanEmail && u.password === password
  )

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email atau password salah.'
    })
  }

  const { password: _, ...userWithoutPassword } = user

  return {
    success: true,
    user: {
      ...userWithoutPassword,
      isGuest: false
    }
  }
})
