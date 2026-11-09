import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS } from '~/server/utils/redis'
import { listCollection, putCollectionItem, hashLen } from '~/server/utils/store'
import { syncBus } from '~/server/utils/bus'
import type { DistractionItem } from '~/types/focus'

const MAX_CONTENT_LENGTH = 2000
const MAX_ITEMS = 500

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.DISTRACTIONS)
  const body = await readBody<{ content?: string }>(event)

  if (!body || typeof body.content !== 'string' || !body.content.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Distraction content is required.' })
  }
  if (body.content.length > MAX_CONTENT_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: 'Distraction content is too long.' })
  }
  if ((await hashLen(key)) >= MAX_ITEMS) {
    throw createError({ statusCode: 400, statusMessage: 'Distraction limit reached.' })
  }

  const newItem: DistractionItem = {
    id: `distraction-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    content: body.content.trim(),
    createdAt: new Date().toISOString(),
    convertedToTask: false
  }

  await putCollectionItem(key, newItem)

  syncBus.emitSync(event, 'distractions', 'create', user.id)

  const distractions = await listCollection<DistractionItem>(key)
  return { distraction: newItem, distractions }
})
