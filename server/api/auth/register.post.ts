import { REDIS_KEYS, redisGet, redisSet } from '~/server/utils/redis'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, email, password } = body || {}

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nama lengkap wajib diisi.'
    })
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email wajib diisi.'
    })
  }

  if (!password || typeof password !== 'string' || password.length < 4) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password minimal 4 karakter.'
    })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim()

  // Fetch current registered users list from Redis
  const { data: rawUsers } = await redisGet<any[]>(REDIS_KEYS.USERS)
  const users = Array.isArray(rawUsers) ? rawUsers : []

  // Check if email already exists
  const existingUser = users.find((u) => u.email && u.email.toLowerCase() === cleanEmail)
  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.'
    })
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    password: password,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaqN2vR_ltj1O12xsA93TrTwUQjwZSEr1BgDryDkchdLcebgdhls7ka0H717ld8PB6r53uifdMWTC46nHJfyCL3m1y5LaEHA_I0BUa32zUsrKXYTcij-QD24oeiKxhaJxIeLGFILUqSx3Bp9mJcQ7anwB5OPUW88219LfaGvcrQyjbx7h3WN9ViglZcR4KBeQpq2lk8J-6r3YETsnBXKOEYZ8n2zPZJWqjYJvyyHzvgNvPhC-hQ2Pm',
    state: 'Relaxed Alertness',
    createdAt: new Date().toISOString()
  }

  users.push(newUser)

  // Save back to Upstash Redis
  await redisSet(REDIS_KEYS.USERS, users)

  const { password: _, ...userWithoutPassword } = newUser

  return {
    success: true,
    user: {
      ...userWithoutPassword,
      isGuest: false
    }
  }
})
