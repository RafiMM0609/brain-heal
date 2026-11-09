import { requireSession, getUserRedisKey } from '~/server/utils/auth'
import { REDIS_KEYS } from '~/server/utils/redis'
import { patchCollectionItem } from '~/server/utils/store'
import { syncBus } from '~/server/utils/bus'
import type { DistractionItem } from '~/types/focus'

const MAX_CONTENT_LENGTH = 2000

export default defineEventHandler(async (event) => {
  const { user } = await requireSession(event)
  const key = getUserRedisKey(user.id, REDIS_KEYS.DISTRACTIONS)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Distraction ID parameter is required.' })
  }

  const body = await readBody<{ convertedToTask?: boolean; content?: string }>(event)

  if (body?.content !== undefined) {
    if (typeof body.content !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid content.' })
    }
    if (body.content.length > MAX_CONTENT_LENGTH) {
      throw createError({ statusCode: 400, statusMessage: 'Distraction content is too long.' })
    }
  }
  if (body?.convertedToTask !== undefined && typeof body.convertedToTask !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid convertedToTask value.' })
  }

  const updatedItem = await patchCollectionItem<DistractionItem>(key, id, (current) => ({
    ...current,
    ...(body?.content !== undefined ? { content: body.content.trim() } : {}),
    ...(body?.convertedToTask !== undefined ? { convertedToTask: body.convertedToTask } : {})
  }))

  if (!updatedItem) {
    throw createError({ statusCode: 404, statusMessage: 'Distraction not found.' })
  }

  syncBus.emitSync(event, 'distractions', 'update', user.id)

  return { distraction: updatedItem }
})
