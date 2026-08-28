import { REDIS_KEYS, redisGet, redisSet } from '~/server/utils/redis'
import type { DistractionItem } from '~/types/focus'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Distraction ID parameter is required.'
    })
  }

  const body = await readBody<{ convertedToTask?: boolean; content?: string }>(event)
  const { data: currentDistractions } = await redisGet<DistractionItem[]>(REDIS_KEYS.DISTRACTIONS)
  const distractionList = currentDistractions || []

  const index = distractionList.findIndex(d => d.id === id)
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: `Distraction with ID ${id} not found.`
    })
  }

  const existing = distractionList[index]
  const updatedItem: DistractionItem = {
    ...existing,
    ...(body.content !== undefined ? { content: body.content.trim() } : {}),
    ...(body.convertedToTask !== undefined ? { convertedToTask: body.convertedToTask } : {})
  }

  distractionList[index] = updatedItem
  await redisSet(REDIS_KEYS.DISTRACTIONS, distractionList)

  return {
    distraction: updatedItem,
    distractions: distractionList
  }
})
