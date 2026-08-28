import { REDIS_KEYS, redisGet, redisSet } from '~/server/utils/redis'
import { syncBus } from '~/server/utils/bus'
import type { DistractionItem } from '~/types/focus'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ content?: string }>(event)

  if (!body || !body.content || !body.content.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Distraction content is required.'
    })
  }

  const { data: currentDistractions } = await redisGet<DistractionItem[]>(REDIS_KEYS.DISTRACTIONS)
  const distractionList = currentDistractions || []

  const newItem: DistractionItem = {
    id: `distraction-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    content: body.content.trim(),
    createdAt: new Date().toISOString(),
    convertedToTask: false
  }

  const updatedList = [newItem, ...distractionList]
  await redisSet(REDIS_KEYS.DISTRACTIONS, updatedList)

  // Broadcast sync event to all connected clients
  syncBus.emitSync('distractions', 'create')

  return {
    distraction: newItem,
    distractions: updatedList
  }
})
