import { REDIS_KEYS, redisGet, redisSet, DEFAULT_USERS } from '~/server/utils/redis'
import type { UserAccount } from '~/types/user'

interface LoginRequestBody {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginRequestBody>(event)
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
  const { data: rawUsers } = await redisGet<UserAccount[]>(REDIS_KEYS.USERS)
  let users: UserAccount[] = []

  if (rawUsers === null || rawUsers === undefined) {
    users = [...DEFAULT_USERS]
    await redisSet(REDIS_KEYS.USERS, users)
  } else if (Array.isArray(rawUsers)) {
    users = rawUsers
  }

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
